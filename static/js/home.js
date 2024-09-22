
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const muteButton = document.getElementById('muteRemote');

/** @type {MediaStream} */
let localStream;
/** @type {RTCPeerConnection} */
let peerConnection;

const ws = new WebSocket("ws://localhost:8000/ws");

function toggleRemoteAudio() {
  if (remoteVideo.muted === true)
    remoteVideo.muted = false
  else remoteVideo.muted = true
}

async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    callButton.disabled = false;
    muteButton.disabled = false;
  } catch (error) {
    console.error('Error accessing media devices.', error);
  }
}

// Create peer connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      ws.send(JSON.stringify({ candidate: event.candidate }));
    }
  };
}

// Handle WebSocket messages (offer/answer/ICE candidates)
ws.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  } else if (data.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

async function startCall() {
  createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));
}

startButton.onclick = startMedia;
callButton.onclick = startCall;
muteRemote.onclick = toggleRemoteAudio;
