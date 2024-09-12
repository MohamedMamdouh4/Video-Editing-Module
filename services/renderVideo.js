const Creatomate = require('creatomate');
require("dotenv").config();
const openAisrc = require('./openAi');

const renderVideo = async (req, res) => {
  try {
    const { selectedContent } = req.body;
    if (!selectedContent) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    const paragraphJson = await openAisrc.splitContent(selectedContent);

    const audioPaths = await Promise.all(
      paragraphJson.map(async (paragraph, index) => {
        return openAisrc.convertTextToAudio(paragraph.text, index);
      })
    );

    const template = require('../Template.json');

    const totalDuration = audioPaths.reduce((acc, audio) => acc + (audio.duration || 15), 0);
    template.duration = totalDuration + 25;

    
    template.elements = [];

    
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
      "source": "913207ea-d0bc-4794-8f49-1f753c8b27d8"
    };
    template.elements.push(track1Element);  

    
    const track4Elements = [
      {
        "id": "ec20c61f-f0af-4c98-aa5f-65653c5b7a1a",
        "type": "image",
        "track": 4,
        "time": 0,  
        "duration": totalDuration - 20,  
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
        "time": totalDuration,  // Start the video at the end
        "duration": 20,  // Last for the last 20 seconds of the total duration
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

    template.elements.push(...track4Elements);  // Add track 4 elements

    // Step 4: Loop through paragraphs to dynamically create images with animations and audio
    let currentTime = 0;
    const timePadding = 0.2;  // Padding between elements

    paragraphJson.forEach((paragraph, index) => {
      let keywordData = paragraph.keywordsAndImages[0];

      // Images Element
      let imageElement = {
        id: `image-${index}`,
        type: "image",
        track: 2,
        time: currentTime,
        duration: audioPaths[index]?.duration || 15,  // Sync with the audio duration
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
        source: keywordData ? String(keywordData.imageUrl) : 'default_image_url_here'
      };

      // Audio Element
      let audioElement = {
        id: `audio-${index}`,
        type: "audio",
        track: 3,
        time: currentTime,
        duration: audioPaths[index]?.duration || 15, 
        source: audioPaths[index]?.url ? String(audioPaths[index].url) : 'default_audio_url_here'
      };

      template.elements.push(imageElement);
      template.elements.push(audioElement);

      currentTime += (audioPaths[index]?.duration || 15) + timePadding;
    });

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
}

module.exports = {
  renderVideo
};
