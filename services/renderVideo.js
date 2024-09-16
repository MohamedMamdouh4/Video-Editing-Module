const Creatomate = require('creatomate');
require("dotenv").config();
const openAiSrc = require('./openAi');

const renderVideo = async (req, res) => {
  try {
    const { paragraphJson } = req.body;
    if (!paragraphJson) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    // Use the input `paragraphJson` to generate audio and add elements to the template
    const template = require('../Template.json');
    let totalDuration = paragraphJson.reduce((acc, paragraph) => acc + (paragraph.audioPath.duration || 15), 0);
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

    // Add static elements (track 4)
    const track4Elements = [
      {
        "id": "ec20c61f-f0af-4c98-aa5f-65653c5b7a1a",
        "type": "image",
        "track": 4,
        "time": 0,
        "duration": totalDuration + 6,
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

    let currentTime = 0;
    const timePadding = 0.4;

    paragraphJson.forEach((paragraph, index) => {
      const { text, keywordsAndImages, audioPath, videoPath } = paragraph;
      const audioDuration = audioPath ? audioPath.duration || 15 : 15;
      let duration = audioDuration;

      if (videoPath) {
        const videoElement = {
          id: `video-${index}`,
          type: "video",
          track: 2,
          time: currentTime,
          source: videoPath, 
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
          ]
        };
        template.elements.push(videoElement);
      } else {
        // If no videoPath, proceed with adding images this is the normal condition the vid will render without videooooooos only images , audios
        const imageUrls = keywordsAndImages[0].imageUrl;
        const imageCount = Math.round(audioDuration / 10);

        // Add image elements for each keyword's images
        for (let i = 0; i < imageCount && i < imageUrls.length; i++) {
          const imageElement = {
            id: `image-${index}-${i}`,
            type: "image",
            track: 2,
            time: currentTime + i * 10,
            duration: Math.min(10, audioDuration - i * 10),
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
            source: imageUrls[i] 
          };
          template.elements.push(imageElement);
        }
      }

      const audioElement = {
        id: `audio-${index}`,
        type: "audio",
        track: 3,
        time: currentTime,
        duration: audioDuration,
        source: audioPath.url 
      };
      template.elements.push(audioElement);

      currentTime += duration + timePadding;
    });

    const creatomateClient = new Creatomate.Client(process.env.CREATOMATE_API_KEY);
    const options = { source: template, modifications: {} };

    console.log('Rendering video, please wait...');
    const renders = await creatomateClient.render(options);
    const videoUrl = renders[0].url;

    return res.status(200).json({
      success: true,
      videoUrl,
      paragraphJson
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  renderVideo
};