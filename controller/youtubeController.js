const fs = require('fs');
const ytdl = require('ytdl-core');
const https = require('https')
const path = require('path');
const ffmpeg = require('ffmpeg-static');
var youtubesearchapi=require('youtube-search-api');
const AutoComplete = require('youtube-autocomplete');
// var gui = require('nw.gui');

const app = require("../server")

exports.getInfo=async (req,res)=>{
   const url = req.body.url;
   
   if(!url){
    res.status(500).send("url is mandatory");
   }

   if(! await ytdl.validateURL(url)){
    res.status(500).send("url is not correct");
   }

   let info = await ytdl.getInfo(url);
   let thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url
   let title = info.player_response.videoDetails.title
   let formats = info.player_response.streamingData;
   res.setHeader("content-disposition", `attachment; filename=video.mp4`,'content-type: audio/mp4');
  
   res.status(200).json({
       title,
       thumbnail,
       formats
   });
}



exports.downloadHighQuality = async(req,res)=>{
    try{


        // Buildin with nodejs
        const cp = require('child_process');
        const readline = require('readline');

        // global constant
        const ref =req.body.url;
        const tracker = {
        start: Date.now(),
        audio: { downloaded: 0, total: Infinity },
        video: { downloaded: 0, total: Infinity },
        merged: { frame: 0, speed: '0x', fps: 0 },
        };
        // Get audio and video streams
        const audio = ytdl(ref, { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
        });
        const video = ytdl(ref, { quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
            tracker.video = { downloaded, total };
        });

        // Prepare the progress bar
        let progressbarHandle = null;
        const progressbarInterval = 1000;
        const showProgress = () => {
        readline.cursorTo(process.stdout, 0);
        const toMB = i => (i / 1024 / 1024).toFixed(2);

        process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);
        
        process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

        app.ioSocket.emit("message",{percentage:(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)+"%"});         

        process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
        process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

        process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
        readline.moveCursor(process.stdout, 0, -3);
        };

        

        // Start the ffmpeg child process
        const ffmpegProcess = cp.spawn(ffmpeg, [
        // Remove ffmpeg's console spamming
        '-loglevel', '8', '-hide_banner',
        // Redirect/Enable progress messages
        '-progress', 'pipe:3',
        // Set inputs
        '-i', 'pipe:4',
        '-i', 'pipe:5',
        // Map audio & video from streams
        '-map', '0:a',
        '-map', '1:v',
        // Keep encoding
        '-c:v', 'copy',
        // Define output file
        `${req.body.fileName}.mkv`,

        ], {
        windowsHide: true,
        stdio: [
            /* Standard: stdin, stdout, stderr */
            'inherit', 'inherit', 'inherit',
            /* Custom: pipe:3, pipe:4, pipe:5 */
            'pipe', 'pipe', 'pipe',
        ],
        });
        ffmpegProcess.on('close', () => {
            app.ioSocket.emit("message",{percentage:"completed"});         
            process.stdout.write('\n\n\n\n');
            clearInterval(progressbarHandle);
            return res.status(200).send("downloaded successfully")
        });

        // Link streams
        // FFmpeg creates the transformer streams and we just have to insert / read data
        ffmpegProcess.stdio[3].on('data', chunk => {
        // Start the progress bar
        if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
        // Parse the param=value list returned by ffmpeg
        const lines = chunk.toString().trim().split('\n');
        const args = {};
        for (const l of lines) {
            const [key, value] = l.split('=');
            args[key.trim()] = value.trim();
        }
        tracker.merged = args;
        });

        console.log(ffmpegProcess.stdio[5],"ffmpegProcess.stdio[5]")
        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);


       

    }
    catch(err){
        res.status(500)
    }
}


exports.youtubeSearch = async (req,res)=>{
    try{
        console.log(req.params.query,"asd")
        const queryResult =await youtubesearchapi.GetListByKeyword(req.params.query,true);
        res.status(200).json(queryResult)
    }
    catch(err){
        res.status(500);
    }
}

exports.youtubeSuggestion= async (req,res)=>{
    try{
       const data = await youtubesearchapi.GetSuggestData()
       res.status(200).json(data);
    }
    catch(err){
        res.status(500)
    }
}

exports.getPlayerUrl=async(req,res)=>{
    try{
        const {id} = req.params
        console.log(id,"sdid")
        const returnedURL = `https://youtu.be/${id}`;
        url = returnedURL+id;
        console.log(url);
        let info = await ytdl.getInfo(url);
        let thumbnail = info.player_response.videoDetails.thumbnail.thumbnails[0].url
        let title = info.player_response.videoDetails.title
        let formats = info.player_response.streamingData;
        console.log(title,"ttt");
        res.status(200).json({formats,title});



    }
    catch(err){
        res.status(500)
    }
}

exports.getKeyWords=async(req,res)=>{
    try{
        await AutoComplete('mian', (err, queries) => {
            if (err) throw err;
            res.status(200).json(queries[1])
        });
    }
    catch(er){
        res.status(500)
    }
}