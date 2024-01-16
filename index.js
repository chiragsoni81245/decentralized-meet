const channelIds = new Set()
const channelConnections = {}
let channelCounter = 0
const connectionStatusTypes = {
    0: "INITIALIZING",
    1: "SDP_CREATED"
}
const mediaSettings = {
    video: true,
    audio: true
}
const localMedia = new CustomMediaStream(mediaSettings)
const addUserButton = document.getElementById("add-user")
const addUserBtnSpinnerElement = document.getElementById("add-user-spinner");
const connectButtonElement = document.getElementById("connect")
const connectBtnSpinnerElement = document.getElementById("connect-spinner");
const remoteSDPElement = document.getElementById("remote-sdp")
const cancelAddUserElement = document.getElementById("cancel-add-user")
const videoBlockListElement = document.getElementById("video-block-list")
const usernameElement = document.getElementById("username")
let currentChannelId;

function logError(message) {
    console.error(message)
}

// Video Block Control In UI
function getVideoBlockElement({ channelId, username }) {
    const videoBlockTemplate = document.createElement("template")
    videoBlockTemplate.innerHTML = `<div class="video-block" id="video-block-${channelId}">
    <p>${username}</p>
    <video autoplay></video>
</div>
    `
    return videoBlockTemplate.content.firstChild
}

function addVideoBlock({ channelId, username }) {
    const videoBlockElement = getVideoBlockElement({ channelId, username })
    videoBlockListElement.appendChild(videoBlockElement)
}

function removeVideoBlock({ channelId }) {
    const videoBlockElement = document.getElementById(`${channelId}-video-block`)
    videoBlockElement.remove()
}
// End

async function createOffer({ username } = {}) {
    const channelId = channelCounter++;
    if (channelIds.has(channelId)) {
        logError(`ChannelId ${channelId} already exists, skipping connection`)
        return
    }
    const lc = new RTCPeerConnection()
    const iceCandidates = []
    const connectionObject = { status: 0, connection: lc }
    lc.onicecandidate = (e) => {
        iceCandidates.push(e.candidate)
        console.log(`[Channel Id: ${channelId}] New ICE Candidate Added, Candidate: ${JSON.stringify({ candidate: e.candidate })}`)
    }
    lc.addTrack(localMedia.tracks.audioTrack)
    lc.addTrack(localMedia.tracks.videoTrack)
    lc.ontrack = ({ track, type }) => {
        console.log(`Got ${type} Track!!`)
        let videoElement = document.querySelector(`#video-block-${channelId} video`)
        if (!videoElement) {
            addVideoBlock({ channelId, username })
        }
        videoElement = document.querySelector(`#video-block-${channelId} video`)

        if (videoElement.srcObject) {
            videoElement.srcObject.addTrack(track)
        } else {
            videoElement.srcObject = new MediaStream([track])
        }
    }
    const offer = await lc.createOffer()
    await lc.setLocalDescription(offer)
    await wait(5)
    connectionObject.sdp = offer.sdp
    connectionObject.status = 1
    channelConnections[channelId] = connectionObject
    return { channelId, sdp: offer.sdp, iceCandidates }
}

async function createAnswer({ remoteSDP, username } = {}) {
    const channelId = channelCounter++;
    if (channelIds.has(channelId)) {
        logError(`ChannelId ${channelId} already exists, skipping connection`)
        return
    }
    const rc = new RTCPeerConnection()
    const iceCandidates = []
    const connectionObject = { status: 0, connection: rc }
    rc.onicecandidate = (e) => {
        iceCandidates.push(e.candidate)
        console.log(`[Channel Id: ${channelId}] New ICE Candidate Added, Candidate: ${JSON.stringify({ candidate: e.candidate })}`)
    }
    rc.addTrack(localMedia.tracks.audioTrack)
    rc.addTrack(localMedia.tracks.videoTrack)
    rc.ontrack = ({ track, type }) => {
        console.log(`Got ${type} Track!!`)
        let videoElement = document.querySelector(`#video-block-${channelId} video`)
        if (!videoElement) {
            addVideoBlock({ channelId, username })
        }
        videoElement = document.querySelector(`#video-block-${channelId} video`)

        if (videoElement.srcObject) {
            videoElement.srcObject.addTrack(track)
        } else {
            videoElement.srcObject = new MediaStream([track])
        }
    }
    await rc.setRemoteDescription({ type: "offer", sdp: remoteSDP })
    const answer = await rc.createAnswer()
    await rc.setLocalDescription(answer)
    await wait(5)
    connectionObject.sdp = answer.sdp
    connectionObject.status = 1
    channelConnections[channelId] = connectionObject
    return { channelId, sdp: answer.sdp, iceCandidates }
}

async function addUser() {
    addUserButton.disabled = true;
    cancelAddUserElement.disabled = false;
    // Loading for add user
    addUserBtnSpinnerElement.classList.add("spinner");

    const username = usernameElement.value
    if (!username) {
        alert('Username is required!')
        addUserButton.disabled = false;
        cancelAddUserElement.disabled = true;
        addUserBtnSpinnerElement.classList.remove("spinner");
        return
    }
    const { channelId, sdp: localSDP, iceCandidates } = await createOffer({ username })
    currentChannelId = channelId
    await wait(0.2, () => {
        navigator.clipboard.writeText(JSON.stringify({
            sdp: localSDP,
            iceCandidates
        }))
    })
    usernameElement.value = ""
    addUserBtnSpinnerElement.classList.remove("spinner");
    alert("Connection String Copied in your clipboard, send it to person to whom you want to connect!!")
}

async function connect() {
    const remoteConnectionString = remoteSDPElement.value
    let channelId;
    if (!remoteConnectionString) return

    connectBtnSpinnerElement.classList.add("spinner");
    const { sdp: remoteSDP, iceCandidates = [] } = JSON.parse(remoteConnectionString)
    const username = usernameElement.value

    if (currentChannelId !== undefined) {
        await channelConnections[currentChannelId].connection.setRemoteDescription({ type: "answer", sdp: remoteSDP })
        channelId = currentChannelId
        addUserButton.disabled = false;
        cancelAddUserElement.disabled = true
        currentChannelId = undefined
    } else {
        if (!username) {
            alert('Username is required!')
            addUserButton.disabled = false;
            cancelAddUserElement.disabled = true
            connectBtnSpinnerElement.classList.remove("spinner");
            return
        }
        const { channelId: _channelId, sdp: localSDP, iceCandidates = [] } = await createAnswer({ remoteSDP, username })
        channelId = _channelId
        await wait(0.2, () => {
            navigator.clipboard.writeText(JSON.stringify({ sdp: localSDP, iceCandidates }))
        })
        alert("Connection String Copied in your clipboard, send it to person to whom you want to connect!!")
    }

    for (let candidate of iceCandidates) {
        await channelConnections[channelId].connection.addIceCandidate(candidate)
    }
    addUserButton.disabled = false;
    cancelAddUserElement.disabled = true
    remoteSDPElement.value = ""
    usernameElement.value = ""
    connectBtnSpinnerElement.classList.remove("spinner");
}

async function cancelAddUser() {
    if (!currentChannelId) return
    currentChannelId = null
}

// Event Listeners
addUserButton.addEventListener("click", addUser)
connectButtonElement.addEventListener("click", connect)
cancelAddUserElement.addEventListener("click", cancelAddUser)
//End

async function checkMediaPermissions() {
    try {
        const tracks = await localMedia.startStream()
        if (!tracks.audioTrack && !tracks.videoTrack) {
            return false
        }
        return true
    } catch (error) {
        return false
    }
}

async function main() {
    // Check Media 
    const isMediaAllowed = await checkMediaPermissions()
    if (!isMediaAllowed) {
        alert("You have to allow atleast one media to run this program!!")
        return main()
    }

    const controlPanel = document.getElementById("control-pannel")
    controlPanel.style.display = "flex";
    //End

    addVideoBlock({ channelId: "local", username: "You" })
    const localVideo = document.querySelector("#video-block-local video")
    const localMediaStream = new MediaStream()
    localMediaStream.addTrack(localMedia.tracks.videoTrack)
    localVideo.srcObject = localMediaStream
}

main()

