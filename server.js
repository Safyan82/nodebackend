const express = require('express')
const bodyParser=require('body-parser');
const app = express();
const cors = require("cors");


const route = require("./routes");


const fs = require('fs');
const https = require('https')
request = require('request');
const path = require('path');
const AutoComplete = require('youtube-autocomplete');



// socket io
const http = require('http');
const server = http.createServer(app);
const {Server}= require("socket.io");
const io = new Server(server,{
  cors: {
    origin: '*',
  }
});
exports.ioSocket =io

// app middleware

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())


var allowedOrigins = ['http://localhost:3000','https://u92.web.app'];
const corsOptionsDelegate = (req, callback) => {
  console.log(req.header('Origin'), 'origin-header');
  if (!req.header('Origin')) return callback(null, true);
  let corsOptions;
  let isDomainAllowed = allowedOrigins.indexOf(req.header('Origin')) !== -1;
  if (isDomainAllowed) {
    // Enable CORS for this request
    corsOptions = {
      origin: true,
      credentials: true,
    }
  } else {
    // Disable CORS for this request
    corsOptions = { origin: false }
  }
  callback(null, corsOptions)
}

app.use(cors(corsOptionsDelegate));


app.use("/api",route);


app.post("/api/download",async(req,res)=>{
  var len ;
  var body ;
  var cur;
  var total;

  res.setHeader("content-disposition", `attachment; filename=${req.body.fileName}`);
  const data = request.get(req.body.downloadUrl)
  .on("response",function(response){

    len = parseInt(response.headers['content-length'], 10);
    body = "";
    cur = 0;
    total = len / 1048576; 
    console.log(total);
  })
  .on("data", function(chunk) {
      body += chunk;
      cur += chunk.length;
      io.sockets.emit(req.body.fileName,{downloaded:(cur / 1048576).toFixed(2) + " mb",total:total.toFixed(2),percentage:(100.0 * cur / len).toFixed(2) + "% "})            
  })
  .on("end", function() {
    io.sockets.emit(req.body.fileName,{downloaded:total.toFixed(2)+ " mb",total:total.toFixed(2),percentage:"completed"});            
  })
  .pipe(res);
  
});



io.on("connection", (socket) => {
  socket.on("keyword",async (data)=>{
    await AutoComplete(data.key, (err, queries) => {
      if (err) return;
      socket.emit("suggestedKeyResult",{keys:queries[1]})
  });
  })
  
});


app.get("/api/keyword/:key",async(req,res)=>{
  try{
      await AutoComplete('mian', (err, queries) => {
          if (err) throw err;
          io.sockets.emit({keys:queries[1]})
      });
  }
  catch(er){
      res.status(500)
  }
})

const port = process.env.port || 5000;

server.listen(port,()=>{console.log("runing at the port"+port)});