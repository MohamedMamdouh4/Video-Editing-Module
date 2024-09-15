const OpenAI = require("openai");
const S3Uploader = require('./uploadToS3')
const getImgs = require('./getImages');
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const splitContent = async (content) => {
    try {
      const prompt = `Could you please split this content into paragraphs, then give me JUST ONE KEYWORD for each paragraph ONLY ONE KEYWORD !!!,
      I need keword to be names of persons that mentioned in pragraph and foucus if this names for famous people (President , Head of governoment , ..)
      IF there are any person mentioned in this paragraph give me name of governomet if mentioned , or name of country, if you dont find any
      anything fo put as keword give me the most important word in this pragraph
      and please don't change the original content EVER!
      Here is the content:
      ${content}
  
      Give me the response in the following format:
      {
        "paragraphs": [
          {
            "text": "Trudeau have been finished his ....",
            "keywords": ["Trudeau"]
          },
          {
            "text": "Trump ordered the .....",
            "keywords": ["Trump"]
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