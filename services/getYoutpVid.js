const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const downloadAndSaveVideo = (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    const outputPath = path.resolve(__dirname, 'videos', 'video.mp4'); 

    const command = `yt-dlp -o "${outputPath}" ${videoUrl}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error during video download: ${error.message}`);
            return res.status(500).send('Error downloading the video');
        }

        console.log(`yt-dlp stdout: ${stdout}`);
        console.error(`yt-dlp stderr: ${stderr}`);

        // Once the video is downloaded, send it to the client
        fs.access(outputPath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Error accessing downloaded video:', err.message);
                return res.status(500).send('Video not found');
            }

            res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
            res.setHeader('Content-Type', 'video/mp4');
            const fileStream = fs.createReadStream(outputPath);
            fileStream.pipe(res);

            // Optionally, you can delete the file after streaming it to save space
            fileStream.on('close', () => {
                fs.unlinkSync(outputPath); // Remove the file after sending it
            });
        });
    });
};

module.exports = {
    downloadAndSaveVideo
};
