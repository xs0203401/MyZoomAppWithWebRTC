/*
References:
1. Socket.io: https://socket.io/docs/v3/broadcasting-events/
2. Simple Peer-to-Peer peer.js: https://peerjs.com/
2.0 Install peer.js: [sudo] npm i -g peer
2.1 Run peer.js env: peerjs --port 3001
3. Host Calling with callerId MetaData: https://stackoverflow.com/questions/63663568/how-do-i-set-metadata-in-the-peerjs-peer-callid-stream-options-function#:~:text=for%20calling%20a%20remote%20peer%20in%20normal%20way%20without%20metadata%20we%20have%3A

*/

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      //   console.log(call.metadata.callerId);
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      console.log("answering to host calling");
      call.on("close", () => {
        video.remove();
      });
      console.log("on close set");
      peers[call.metadata.callerId] = call;
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  //   console.log(userId);
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// socket.on("user-connected", (userId) => {
//   console.log("User Connected: ID = " + userId);
// });

function connectToNewUser(userId, stream) {
  const options = { metadata: { callerId: myPeer.id } };
  const call = myPeer.call(userId, stream, options);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
