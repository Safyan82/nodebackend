
app.post("/api/dowload",async(req,res)=>{
  
  
    // create directory if not exist;

    const downloadsFolder = require('downloads-folder');
    var dirname = (downloadsFolder.windows())+'/youtubeVideos';
    if (!fs.existsSync(dirname))
    {
        fs.mkdirSync(dirname);
    }

    // file name random genetor
    const filepath = path.join(dirname,req.body.fileName);
    
    // get file from url
    await https.get(req.body.downloadUrl, function(response) {
        
        const file=fs.createWriteStream(filepath);
        response.pipe(file)

        

            var len = parseInt(response.headers['content-length'], 10);
            var body = "";
            var cur = 0;
            var total = len / 1048576; //1048576 - bytes in  1Megabyte

            response.on("data", function(chunk) {
                body += chunk;
                cur += chunk.length;
                io.sockets.emit("message",{downloaded:(cur / 1048576).toFixed(2) + " mb",total:total.toFixed(2),percentage:(100.0 * cur / len).toFixed(2) + "% "})            
            });

            response.on("end", function() {
              io.sockets.emit("message",{downloaded:total.toFixed(2)+ " mb",total:total.toFixed(2),percentage:"completed"});            
            });



        // open window and player to play the video
        file.on('finish',()=>{

            const windowPath = path.win32.resolve(dirname).replace('\\mnt\\c\\', 'c:\\\\');
            require('child_process').exec(`explorer.exe "${windowPath}"`);

            const winPath = path.win32.resolve(filepath).replace('\\mnt\\c\\', 'c:\\\\');
            require('child_process').exec(`explorer.exe "${winPath}"`);

        })

        file.on('error',(err)=>{
            res.status(500).send("An err occured",err);
        })


    })
    
    res.status(200).json("downloading")


});

