
// vedios
const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const path = require("path");

let routes = app => {
  router.get("/", homeController.getHome);

  router.post("/upload", uploadController.uploadFiles);
  router.get("/files", uploadController.getListFiles);
  router.get("/files/:name", uploadController.download);
  router.get("/stream/:name", uploadController.streamVideo);

  // Serve the "display.html" page using the correct path
  router.get("/display", (req, res) => {
    const displayFilePath = path.join(__dirname, "../views/display.html");
    res.sendFile(displayFilePath);
  });

  return app.use("/", router);
};

module.exports = routes;