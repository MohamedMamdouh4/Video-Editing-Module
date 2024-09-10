const express = require('express');
const Creatomate = require('creatomate');
const app = express();
app.use(express.json()); 
require("dotenv").config();

const template = require('./Template.json');
const client = new Creatomate.Client(process.env.CREATOMATE_API_KEY);

for(element of template.elements){
  console.log("------------->",element.source);
  if(element.source == "")
  {
    element.source = "https://ichef.bbci.co.uk/news/480/cpsprodpb/7a23/live/653b23a0-6bb2-11ef-93ee-6f9b99da9308.jpg.webp"
  }
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