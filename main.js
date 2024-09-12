const express = require('express');
require("dotenv").config();
const app = express();
app.use(express.json());
const renderVideo = require('./services/renderVideo')


app.post('/render-video', renderVideo.renderVideo);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});