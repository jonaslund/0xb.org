var express = require('express'),
    http = require("http"),
    path = require('path'),
    fs = require("fs"),
    exec = require('child_process').exec,
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

var fileNameCount = 0;

app.post("/upload", function(req, res) {
    fileNameCount++;

    var data = req.body;
    var fileRootName = data.filename+"_"+fileNameCount,
        fileExtension = "wav",
        filePathBase = 'uploads/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,        
        fileBuffer;

    data.contents = data.contents.split(',').pop();
    fileBuffer = new Buffer(data.contents, "base64");    
        
    fs.writeFile(filePath, fileBuffer, function() {
      console.log("done writing");

      var cmd = "lame -V 5 " + filePath + " " + filePathBase+fileRootName + ".mp3; rm " + filePath;
      exec(cmd, function (error, stdout, stderr) {          
        console.log("done converting");
      });
                
      res.send("success");
    });

});

server.listen(3100);