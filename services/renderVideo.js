const Creatomate = require('creatomate');
require("dotenv").config();
const openAiSrc = require('./openAi');

const renderVideo = async (req, res) => {
  try {
    const { selectedContent } = req.body;
    if (!selectedContent) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    const paragraphJson = await openAiSrc.splitContent(selectedContent);

    const audioPaths = await Promise.all(
      paragraphJson.map(async (paragraph, index) => {
        return openAiSrc.convertTextToAudio(paragraph.text, index);
      })
    );

    const template = require('../Template.json');
    const totalDuration = audioPaths.reduce((acc, audio) => acc + (audio.duration || 15), 0);
    template.duration = totalDuration + 25;
    template.elements = [];

    // Add background video (track 1)
    const track1Element = {
      "id": "b7e651cc-3cc0-46c7-99a8-77d8a1ba2758",
      "type": "video",
      "track": 1,
      "time": 0,
      "animations": [
        {
          "time": 0,
          "duration": 1,
          "easing": "quadratic-out",
          "type": "slide",
          "direction": "270°"
        }
      ],
      "source": "https://drive.google.com/file/d/1usbexWCpNdrq-wiqvbVIhJHfuxiTkcf4/view?usp=sharing"
    };
    template.elements.push(track1Element);  

    // Add other video or image elements any static element (track 4) 
    const track4Elements = [
      {
        "id": "ec20c61f-f0af-4c98-aa5f-65653c5b7a1a",
        "type": "image",
        "track": 4,
        "time": 0,
        "duration": totalDuration + 6 ,
        "x": "93.6257%",
        "y": "10.2028%",
        "width": "8.0154%",
        "height": "14.4895%",
        "clip": true,
        "animations": [
          {
            "time": 0.077,
            "duration": 1.566,
            "transition": true,
            "type": "slide",
            "direction": "90°"
          }
        ],
        "source": "207563f8-29f0-4440-94c0-7a063c1c24ff"
      },
      {
        "id": "d1102837-3761-459a-9868-67e6a2e5a619",
        "type": "video",
        "track": 4,
        "time": totalDuration + 6,
        "duration": 20, 
        "source": "fdd26979-7b5a-4fee-b2bd-d8c7dec8c93c",
        "animations": [
          {
            "time": 0.077,
            "duration": 1.566,
            "transition": true,
            "type": "slide",
            "direction": "90°"
          }
        ]
      }
    ];
    template.elements.push(...track4Elements);

    // Start looping on pragraphs to set the images with audios 
    let currentTime = 0;
    const timePadding = 0.4;  

    paragraphJson.forEach((paragraph, index) => {
      const audioDuration = audioPaths[index]?.duration || 15;
      const imageCount = Math.round(audioDuration / 10);  
      const keywordData = paragraph.keywordsAndImages;  

      for (let i = 0; i < imageCount; i++) {
        const imageElement = {
          id: `image-${index}-${i}`,
          type: "image",
          track: 2,
          time: currentTime + i * 10,  // Stagger images every 10 seconds
          duration: Math.min(10, audioDuration - i * 10),  // Limit each image to max 10 seconds or take the duration of remainder time from audio
          width: "60.1639%",
          height: "58.8122%",
          x_scale: [
            { time: 0.077, value: "100%" },
            { time: "end", value: "115%" }
          ],
          y_scale: [
            { time: 0.077, value: "100%" },
            { time: "end", value: "115%" }
          ],
          stroke_color: "#fdfdfd",
          stroke_width: "1.5 vmin",
          stroke_join: "miter",
          shadow_color: "rgba(0,0,0,0.65)",
          shadow_blur: "5.5 vmin",
          shadow_x: "4 vmin",
          shadow_y: "4 vmin",
          clip: true,
          animations: [
            {
              time: 0.077,
              duration: 1.566,
              transition: true,
              type: "slide",
              direction: "90°"
            }
          ],
          source: String(keywordData[0]?.imageUrl[i]) 
        };
        template.elements.push(imageElement);
      }
    
      // Add the audio element to cover all images at the same time 
      const audioElement = {
        id: `audio-${index}`,
        type: "audio",
        track: 3,
        time: currentTime,
        duration: audioDuration,
        source: String(audioPaths[index]?.url)
      };
      template.elements.push(audioElement);
    
      currentTime += audioDuration + timePadding;
    });

    const creatomateClient = new Creatomate.Client(process.env.CREATOMATE_API_KEY);
    const options = { source: template, modifications: {} };

    console.log('Rendering video, please wait...');
    const renders = await creatomateClient.render(options);
    const videoUrl = renders[0].url;

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
};

module.exports = {
  renderVideo
};
