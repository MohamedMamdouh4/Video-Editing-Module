const Creatomate = require('creatomate');
require("dotenv").config();
const openAiSrc = require('./openAi');

const renderVideo = async (req, res) => {
  try {
    const { paragraphJson , slide1Json , slide2Json} = req.body;
    if (!paragraphJson || !slide1Json || !slide2Json) {
      return res.status(400).json({ success: false, error: "No content provided" });
    }

    const template = require('../Template.json');
    let bodyDuration = paragraphJson.reduce((acc, paragraph) => acc + (paragraph.audioPath.duration || 15), 0); 
    let slide1lDuration = slide1Json.reduce((acc, slide1) => acc + (slide1.audioPath.duration || 15), 0); 
    let slide2lDuration = slide1Json.reduce((acc, slide2) => acc + (slide2.audioPath.duration || 15), 0); 
    let totalDuration = bodyDuration + slide1lDuration + slide2lDuration;
    template.duration = totalDuration + 20; 
    const timePadding = 0.4;
    let currentTime = 0;

    // adding to slide 1
    slide1Json.forEach((slide1, index) => {
      const { text, keywordsAndImages, audioPath} = slide1;
      const audioDuration = audioPath ? audioPath.duration || 15 : 15;
      template.elements[1].duration = audioDuration

      template.elements[1].elements[0].source = String(keywordsAndImages[0].imageUrl)
      template.elements[1].elements[2].text = "STATE\nOF\nTE\nCOUNTRY"
      template.elements[1].elements[3].source = String(audioPath.url)
      template.elements[1].elements[3].duration = audioDuration
    

      const audioElement = {
        id: `audio-${index}`,
        type: "audio",
        track: 3,
        time: currentTime,
        duration: audioDuration,
        source: audioPath.url 
      };
      // template.elements[0].elements.push(audioElement);

      currentTime += template.elements[1].duration + timePadding;
    });

    // adding to slide 2
    slide2Json.forEach((slide2, index) => {
      const { text, keywordsAndImages, audioPath} = slide2;
      const audioDuration = audioPath ? audioPath.duration || 15 : 15;
      template.elements[2].time = currentTime
      template.elements[2].duration = audioDuration
      template.elements[2].x[0].time = audioDuration - 4
      template.elements[2].x_scale[0].time = audioDuration - 7


      template.elements[2].elements[3].source = String(keywordsAndImages[0].imageUrl)
      template.elements[2].elements[5].text = "PEOPLE"
      template.elements[2].elements[6].source = String(audioPath.url)
      template.elements[2].elements[6].duration = audioDuration

      currentTime += template.elements[2].duration + timePadding;
    });

    // adding elements to body
    const track1Element = {
      "id": "b7e651cc-3cc0-46c7-99a8-77d8a1ba2758",
      "type": "video",
      "track": 1,
      "time": currentTime, // ----> here the start time need to be dynamic ** start after all slides finishes
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
    template.elements[0].elements.push(track1Element);  

    const track4Elements = [
      {
        "id": "ec20c61f-f0af-4c98-aa5f-65653c5b7a1a",
        "type": "image",
        "track": 4,
        "time": currentTime, // ----> this is logo, here the start time need to be dynamic ** start after all slides finishes
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
    template.elements[0].elements.push(...track4Elements);


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
        template.elements[0].elements.push(videoElement);
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
          template.elements[0].elements.push(imageElement);
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
      template.elements[0].elements.push(audioElement);

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