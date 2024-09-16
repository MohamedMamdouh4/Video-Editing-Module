const { getAudioDurationInSeconds } = require('get-audio-duration')

getAudioDurationInSeconds(`https://machine-genius.s3.amazonaws.com/My_Audios/audio-${index}.mp3`).then((duration) => {
    audioDurationInSeconds.push({url: `https://machine-genius.s3.amazonaws.com/My_Audios/audio-${index}.mp3`, duration })
    return audioDurationInSeconds
})