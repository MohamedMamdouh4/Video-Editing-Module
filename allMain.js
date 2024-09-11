const express = require('express');
const OpenAI = require("openai");
const axios = require('axios');
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const Creatomate = require('creatomate');
require("dotenv").config();
const getImgs = require('./getImages');
const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// AWS S3 upload function for audio files
const uploadToS3 = async (audioStream, index) => {
  try {
    const upload = new Upload({
      client: client,
      params: {
        Bucket: 'machine-genius',
        Key: `My_Audios/audio-${index}.mp3`,
        Body: audioStream,
        ContentType: 'audio/mpeg',
        ACL: "public-read-write",
      },
    });

    await upload.done();
    return `https://machine-genius.s3.amazonaws.com/My_Audios/audio-${index}.mp3`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};


const splitContent = async (content) => {
    try {
      const prompt = `Could you please split this content into paragraphs, then give me one or more max(2) KeyWords for each paragraph just mention the popular (presdint , head of governoment ,...)
      and please don't change the original content EVER!
      Here is the content:
      ${content}
  
      Give me the response in the following format:
      {
        "paragraphs": [
          {
            "text": "This is the first paragraph.",
            "keywords": ["first", "paragraph"]
          },
          {
            "text": "This is the second paragraph.",
            "keywords": ["second", "paragraph"]
          }
        ]
      }`;
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4", 
        messages: [{ role: "user", content: prompt }],
      });
  
      const rawResult = completion.choices[0].message.content.trim();
      console.log("Raw API Response:", rawResult); // Log raw response for debugging
  
      let parsedResult;
      try {
        parsedResult = JSON.parse(rawResult);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error("Invalid JSON response from OpenAI");
      }
      const resultObject = await Promise.all(parsedResult.paragraphs.map(async (paragraph) => {
        const keywordsAndImages = await Promise.all(paragraph.keywords.map(async (keyword) => {
          const imageUrl = await getImgs.handleSearchImg(keyword);
          return { keyword, imageUrl };
        }));
  
        return {
          text: paragraph.text,
          keywordsAndImages,
        };
      }));
  
      return resultObject;
    } catch (error) {
      console.error("Error generating title and content:", error);
      throw error;
    }
};
  
const convertTextToAudio = async (text, index) => {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const audioStream = response.body; 
    return await uploadToS3(audioStream, index);
  } catch (error) {
    console.error("Error converting text to audio:", error);
    throw error;
  }
};

app.post('/render-video', async (req, res) => {
  try {
    const { selectedContent } = req.body;
    if (!selectedContent) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    // Split content to ore than one paragraph 
    const paragraphJson = await splitContent(selectedContent);

    // Generate audio for each paragraph
    const audioPaths = await Promise.all(
      paragraphJson.map(async (paragraph, index) => {
        return convertTextToAudio(paragraph.text, index);
      })
    );

    // Load template
    const template = require('./Template.json');

    let currentDuration = 15;  
    let incrementDuration = 15; 
    let time = 0
    for (element of template.elements) {
      const [type, index] = element.id.split("-");
      if(time == 0)
      {
        element.time = 0
        time+=1
      }
      
      if (type === "image") {
        let imageIndex = parseInt(index, 10); 
        let keywordData = paragraphJson[imageIndex]?.keywordsAndImages[0]; 
        element.source = keywordData ? String(keywordData.imageUrl) : String
      }
    
      if (type === "audio") {
        let audioIndex = parseInt(index, 10); 
        element.source = audioPaths[audioIndex] ? String(audioPaths[audioIndex]) : String('default_audio_url_here');
      }
    

      element.duration = currentDuration;  // Set the duration for the current element
      currentDuration += incrementDuration;  // Increment for the next element
      element.time += (currentDuration+20)
    }

    const creatomateClient = new Creatomate.Client(process.env.CREATOMATE_API_KEY);
    const options = { source: template, modifications: {} };

    console.log('Rendering video, please wait...');
    const renders = await creatomateClient.render(options);
    const videoUrl = renders[0].url;

    // Return video URL and content info
    return res.status(200).json({
      success: true,
      videoUrl,
      paragraphJson,
      audioPaths
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});