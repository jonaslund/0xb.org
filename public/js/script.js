var videos = [];
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection;

function cloneVideo(domId, socketId) {
  var video = document.getElementById(domId);
  var clone = video.cloneNode(false);
  clone.id = "remote" + socketId;
  document.getElementById('videos').appendChild(clone);
  videos.push(clone);
  return clone;
}

function removeVideo(socketId) {
  var video = document.getElementById('remote' + socketId);
  if(video) {
    videos.splice(videos.indexOf(video), 1);
    video.parentNode.removeChild(video);
  }
}

function sanitize(msg) {
  return msg.replace(/</g, '&lt;');
}

var dataChannelChat = {
  send: function(message) {
    for(var connection in rtc.dataChannels) {
      var channel = rtc.dataChannels[connection];
      channel.send(message);
    }
  },
  recv: function(channel, message) {
    return JSON.parse(message).data;
  },
  event: 'data stream data'
};


function init() {
  if(PeerConnection) {
    rtc.createStream({
      "video": false,
      "audio": true
    }, function(stream) {
      document.getElementById('you').src = URL.createObjectURL(stream);
      document.getElementById('you').play();
      document.getElementById('you').volume=0;
  
      recordAudio = RecordRTC(stream, {
          bufferSize: 4096
      });

      (function saveRecord() {
        recordAudio.startRecording();
        var fileNameStart = new Date().getTime();        

        setTimeout(function() {          
          recordAudio.stopRecording(function(audioURL) {           
            recordAudio.getDataURL(function(audioDataURL) { 

              //send to server      
              var file = {
                  audio: {
                    name: fileNameStart + '.wav',
                    type: 'audio/wav',
                    contents: audioDataURL
                  }};

              $.ajax({
                type: "POST",
                url: "/upload",
                data: {
                  contents: audioDataURL,
                  filename: fileNameStart
                },
                success: function(data) {
                  console.log(data);
                  saveRecord();
                }
              });

            });        
          }); 
        }, 10000);

      })();
      
    });
  } else {
    alert('Your browser is not supported or you have to turn on flags. In Chrome you go to chrome://flags and turn on Enable PeerConnection remember to restart chrome');
  }


  var room = window.location.hash.slice(1);
  rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], room);

  rtc.on('add remote stream', function(stream, socketId) {
    console.log("ADDING REMOTE STREAM...");
    var clone = cloneVideo('you', socketId);
    document.getElementById(clone.id).setAttribute("class", "");
    rtc.attachStream(stream, clone.id);
    subdivideVideos();


  });
  
  rtc.on('disconnect stream', function(data) {
    console.log('remove ' + data);
    removeVideo(data);

  });

  function xhr(url, data, callback) {
      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
          if (request.readyState == 4 && request.status == 200) {
              callback(request.responseText);
          }
      };
      request.open('POST', url);
      request.send(data);
  }

}