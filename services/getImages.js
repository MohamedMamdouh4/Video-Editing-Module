require("dotenv").config();
const axios = require('axios');

const handleSearchImg = async (searchImgKeyword) => {
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        q: searchImgKeyword,
        engine: 'google_images',
        ijn: '0',
        api_key: process.env.SERPAPI_KEY || "fdfd21a7ca252814cc50f03f935c29f99bc21c6478d5778c6f104f4881670eae"
      }
    });
    
    const imageResults = response.data.images_results || [];
    const originalImageUrls = imageResults.map(image => image.original).filter(Boolean);

    return originalImageUrls.slice(0,1);
  } catch (error) {
    console.error("Error getting image:", error);
    throw error;
  }
};

const getImg = async (req, res) => {
  try {
    const { searchImgKeyword } = req.body;
    if (!searchImgKeyword) {
      return res
        .status(400)
        .json({ success: false, error: "No image name provided" });
    }
    const images = await handleSearchImg(searchImgKeyword);

    return res.json({ success: true, images });
  } catch (error) {
    console.error("Error in getImg:", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong!" });
  }
};

module.exports =
{
    getImg,
    handleSearchImg
}