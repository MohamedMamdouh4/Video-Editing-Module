const OpenAI = require("openai");
const S3Uploader = require('./uploadToS3')
const getImgs = require('./getImages');
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const splitContent = async (content) => {
    try {
      const prompt = `Could you please split this content into paragraphs, then give one KeyWord for each paragraph,
      and i need to make this keywoerd to be name of famous person JUST MENTION THE FAMOUS NAMES OF ONLY LIKE (presdint , head of governoment , ...)
      dont give me any names ever!!!! 
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
      console.log("Trimmed Response:", rawResult);
  
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
    return await S3Uploader.uploadToS3(audioStream, index);
  } catch (error) {
    console.error("Error converting text to audio:", error);
    throw error;
  }
};

module.exports =
{
    convertTextToAudio,
    splitContent
}