const express = require('express');
const Creatomate = require('creatomate');
const app = express();
app.use(express.json()); 
require("dotenv").config();

const template = require('./Template.json');
const client = new Creatomate.Client(process.env.CREATOMATE_API_KEY);

for(element of template.elements){
  // console.log("------------->",element.source);
  if(element.id.split("-")[0] == "image")
  {
    if(element.id.split("-")[1] == 0)
    { 
      element.source = "https://www.ctvnews.ca/content/dam/ctvnews/en/images/2024/9/6/prime-minister-justin-trudeau-answers-questions-1-7028391-1725653410377.jpg" 
      element.duration = 10
      element.time = 0.4
    }
    if(element.id.split("-")[1] == 1)
    { 
      element.source = "https://www.ctvnews.ca/content/dam/ctvnews/en/images/2024/9/6/prime-minister-designate-justin-trudeau-1-7028361-1725652679801.jpg" 
      element.duration = 13
      element.time = 12
    }
  }

  if(element.id.split("-")[0] == "audio")
    {
      if(element.id.split("-")[1] == 0)
      { 
        element.source = "https://machine-genius.s3.amazonaws.com/My+Audios/audio-0.mp3" 
        element.duration = 10
        element.time = 0.4
      }
      if(element.id.split("-")[1] == 1)
      { 
        element.source = "https://machine-genius.s3.amazonaws.com/My+Audios/audio-1.mp3" 
        element.duration = 13
        element.time = 12
      }
    }

  console.log("------------->",element.source);
}
console.log("...........");
app.post('/render-video', async (req, res) => {
  console.log(template);  
  try {
    const options = {
      source: template,
      modifications: {        
      },
    };

    console.log('Rendering video, please wait...');

    const renders = await client.render(options);
    const videoUrl = renders[0].url;
    
    return res.status(200).json({ videoUrl });
  } catch (error) {
    if (error.name === 'InsufficientCreditsError') {
      console.error('Insufficient credits for rendering video.');
      return res.status(402).json({ error: 'Insufficient credits to render video. Please add more credits to your account.' });
    }
    
    console.error('Error rendering video:', error);
    return res.status(500).json({ error: 'An error occurred while rendering the video.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});