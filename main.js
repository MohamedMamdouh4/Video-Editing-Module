const express = require('express');
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
require("dotenv").config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const splitContent = async (content) => {
  try {
    const prompt = `Could you please split this content into paragraphs, then give me the Key Word for each paragraph and please don't change the original content EVER!

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
      model: "gpt-4", // Ensure this model name is correct
      messages: [{ role: "user", content: prompt }],
    });

    const rawResult = completion.choices[0].message.content.trim();
    console.log("Raw API Response:", rawResult); // Log raw response for debugging

    // Attempt to parse the response
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Process the parsed result
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

const convertTextToAudio = async (text, index) => {
  try {    
    const audioPath = path.join(__dirname, `audio-${index}.mp3`);

    const response = await axios({
      method: 'post',
      url: 'https://api.wellsaidlabs.com/v1/tts/stream',
      headers: {
        'X-Api-Key': process.env.WELLSAID_API_KEY, 
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      data: {
        text: text,
        speaker_id: "20",
      },
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream(audioPath));
    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve(audioPath));
      response.data.on('error', reject);
    });

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
