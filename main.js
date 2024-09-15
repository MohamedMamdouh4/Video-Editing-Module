const express = require('express');
require("dotenv").config();
const app = express();
app.use(express.json());
const renderVideo = require('./services/renderVideo')
const getImages = require('./services/getImages')


app.post('/render-video', renderVideo.renderVideo);
app.post('/get-img', getImages.getImg);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});