// vedios

const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const dbConfig = require("../config/db");

var storage = new GridFsStorage({
  url: dbConfig.url + dbConfig.database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const imageMimeTypes = ["image/png", "image/jpeg"];
    const documentMimeTypes = ["application/pdf", "application/msword"];
    const videoMimeTypes = ["video/mp4", "video/quicktime"]; 

    let bucketName;

    if (imageMimeTypes.includes(file.mimetype)) {
      bucketName = dbConfig.imgBucket;
    } else if (documentMimeTypes.includes(file.mimetype)) {
      bucketName = dbConfig.fileBucket;
    } else if (videoMimeTypes.includes(file.mimetype)) {
      bucketName = dbConfig.videoBucket;
    } else {
      return null; // Don't upload files with unsupported MIME types
    }

    return {
      bucketName: bucketName,
      filename: `${Date.now()}-bezkoder-${file.originalname}`,
    };
  },
});

var uploadFiles = multer({ storage: storage }).array("file", 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;


