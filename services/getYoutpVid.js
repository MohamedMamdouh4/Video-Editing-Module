const fs = require('fs');
const ytdl = require('ytdl-core');
const path = require('path');

const downloadAndSaveVideo = async (req, res) => {
    const { videoUrl, videoTitle } = req.body;

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const savePath = path.resolve(__dirname, `${videoTitle || 'video'}.mp4`);
        const videoStream = ytdl(videoUrl, { quality: 'highest' });
        const writeStream = fs.createWriteStream(savePath);
        videoStream.pipe(writeStream);

        writeStream.on('finish', () => {
            console.log(`Video downloaded and saved as ${savePath}`);
            res.status(200).json({
                message: 'Video downloaded successfully',
                filePath: savePath
            });
        });

        videoStream.on('error', (error) => {
            console.error('Error during video stream:', error);
            res.status(500).json({ error: 'Error downloading video' });
        });

        writeStream.on('error', (error) => {
            console.error('Error during file write:', error);
            res.status(500).json({ error: 'Error saving video' });
        });
    } catch (error) {
        console.error('Error downloading the video:', error);
        res.status(500).json({ error: 'Failed to download and save video' });
    }
};

module.exports = {
    downloadAndSaveVideo
}