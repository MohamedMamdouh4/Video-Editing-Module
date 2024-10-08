const express = require('express');
require("dotenv").config();
const app = express();
app.use(express.json());

const openAiController = require('./services/openAi')
const renderVideo = require('./services/renderVideo')
const getImages = require('./services/getImages')
const getUrlVid = require('./services/getYoutpVid')

app.post('/render-video', renderVideo.renderVideo);
app.post('/get-img', getImages.getImg);
app.post('/split-content', openAiController.splitAndConvert);
app.post('/regenrate-audio', openAiController.regenrateAudio);
app.post('/download-youtube-video', getUrlVid.downloadAndSaveVideo);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});