var express = require('express'),
    http = require("http"),
    path = require('path'),
    fs = require("fs"),
    app = express(),    
    server = http.createServer(app),    
    webRTC = require('webrtc.io').listen(server);

app.configure('development', function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');  
  app.use(express.bodyParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('port', 3100);
});

app.configure('production', function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');  
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());    
  app.set('port', 3100);
});

app.get('/', function(req, res) {
  res.render('home');
});

app.post("/upload", function(req, res) {
    
    var data = req.body;
    var fileRootName = data.filename,
        fileExtension = ".wav",
        filePathBase = 'uploads/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,        
        fileBuffer;


    data.contents = data.contents.split(',').pop();

    fileBuffer = new Buffer(data.contents, "base64");    
    fs.writeFile(filePath, fileBuffer, function() {
      console.log("done");
      res.send("success");
    });

});

webRTC.rtc.on("add remote stream", function(data, socket) {
  console.log("added stream");
});

webRTC.rtc.on('chat_msg', function(data, socket) {
  var roomList = webRTC.rtc.rooms[data.room] || [];  

  for (var i = 0; i < roomList.length; i++) {
    var socketId = roomList[i];

    if (socketId !== socket.id) {
      var soc = webRTC.rtc.getSocket(socketId);

      if (soc) {
        soc.send(JSON.stringify({
          "eventName": "receive_chat_msg",
          "data": {
            "messages": data.messages,
            "color": data.color
          }
        }), function(error) {
          if (error) {
            console.log(error);
          }
        });
      }
    }
  }
});

server.listen(3100);