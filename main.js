const express = require('express');
const OpenAI = require("openai");
const axios = require('axios');
// const { S3Client } = require("@aws-sdk/client-s3");
// const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); // CommonJS import
require("dotenv").config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure AWS S3 Client
const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const uploadToS3 = async (audioStream, index) => {
  try {
    // const upload = new Upload({
    //   client: client,
    //   params: {
    //     Bucket: 'machine-genius',
    //     Key: `My_Audios/audio-${index}.mp3`,
    //     Body: audioStream,
    //     ContentType: 'audio/mpeg',
    //   },
    // });
    
    const input = {
      ACL: "public-read-write", // Set appropriate ACL
      Body: audioStream, // Use the stream from OpenAI
      Bucket: 'machine-genius',
      Key: `My_Audios/audio-${index}.mp3`
      // ContentType: 'audio/mpeg',
    };

    console.log("here");    
    const command = new PutObjectCommand(input);
    console.log("command--->" , command);   
    const response = await client.send(command);
    console.log("File uploaded successfully:", response);

    // await upload.done();
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

    const resultObject = parsedResult.paragraphs.map(paragraph => ({
      text: paragraph.text,
      keywords: paragraph.keywords.map(keyword => keyword.toLowerCase().replace(/[^a-z0-9]/g, ''))
    }));

    return resultObject;
  } catch (error) {
    console.error("Error generating title and content:", error);
    throw error;
  }
};

// Updated convertTextToAudio function using OpenAI's TTS API
const convertTextToAudio = async (text, index) => {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // Optional: choose the voice if required
      input: text,
    });

    const audioStream = response.body; // Extract the PassThrough stream

    // Upload the audio stream to S3
    return await uploadToS3(audioStream, index);
  } catch (error) {
    console.error("Error converting text to audio:", error);
    throw error;
  }
};


const generateContent = async (req, res) => {
  try {
    const { selectedContent } = req.body;
    if (!selectedContent) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    const paragraphJson = await splitContent(selectedContent);

    const audioPaths = await Promise.all(
      paragraphJson.map(async (paragraph, index) => {
        return convertTextToAudio(paragraph.text, index);
      })
    );

    return res.json({ success: true, paragraphJson, audioPaths });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/split-content', generateContent);

app.listen(6000, () => {
  console.log(`Server is Running at http://localhost:6000`);
});