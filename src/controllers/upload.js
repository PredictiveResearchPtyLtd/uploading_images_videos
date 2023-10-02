// vedios

const upload = require("../middleware/upload");
const dbConfig = require("../config/db");
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const url = dbConfig.url;
const baseUrl = "http://localhost:8080/files/";
const mongoClient = new MongoClient(url);

const uploadFiles = async (req, res) => {
  try {
    await upload(req, res);
    console.log(req.files);

    if (req.files.length <= 0) {
      return res.status(400).send({ message: "You must select at least 1 file." });
    }

    // Send a response that includes the "Display" button
    const responseHtml = `
      <p>Files have been uploaded.</p>
      <a href="/display">Display</a>
    `;

    return res.status(200).send(responseHtml);
  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send({ message: "Too many files to upload." });
    }
    return res.status(500).send({
      message: `Error when trying to upload many files: ${error}`,
    });
  }
};

const getListFiles = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    const imageFiles = database.collection(dbConfig.imgBucket + ".files");
    const documentFiles = database.collection(dbConfig.fileBucket + ".files");
    const videoFiles = database.collection(dbConfig.videoBucket + ".files");

    const cursorImages = imageFiles.find({});
    const cursorDocuments = documentFiles.find({});
    const cursorVideos = videoFiles.find({});

    const [images, documents, videos] = await Promise.all([
      cursorImages.toArray(),
      cursorDocuments.toArray(),
      cursorVideos.toArray(),
    ]);

    let fileInfos = [];

    // Add image files to fileInfos
    images.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + doc.filename,
      });
    });

    // Add document files to fileInfos
    documents.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + doc.filename,
      });
    });

    // Add video files to fileInfos
    videos.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + doc.filename,
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const download = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    let bucketName;
    let collectionName;

    if (req.params.name.includes(".pdf") || req.params.name.includes(".doc")) {
      bucketName = dbConfig.fileBucket;
      collectionName = "files.files";
    } else if (req.params.name.includes(".mp4") || req.params.name.includes(".mov")) {
      bucketName = dbConfig.videoBucket; 
      collectionName = dbConfig.videoBucket + ".files"; 
    } else {
      bucketName = dbConfig.imgBucket;
      collectionName = dbConfig.imgBucket + ".files";
    }

    const bucket = new GridFSBucket(database, {
      bucketName: bucketName,
    });

    let downloadStream = bucket.openDownloadStreamByName(req.params.name);

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
      return res.status(404).send({ message: "Cannot download the file!" });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const streamVideo = async (req, res) => {
  try {
    const fileName = req.params.name;
    const database = mongoClient.db(dbConfig.database);
    const bucket = new GridFSBucket(database, {
      bucketName: dbConfig.videoBucket,
    });

    const videoStream = bucket.openDownloadStreamByName(fileName);
    
    // Set the appropriate content type for video
    res.setHeader('Content-Type', 'video/mp4'); // Adjust the content type as needed

    videoStream.pipe(res);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  uploadFiles,
  getListFiles,
  download,
  streamVideo,
};