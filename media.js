class CustomMediaStream{
    constructor({video = true, audio = true} = {}){
        this.settings = {video, audio}
        this.tracks = {
            videoTrack: null,
            audioTrack: null
        }
        this.stream = null
    }
    
    stopStream(){
        audioTrack.stop()
        videoTrack.stop()
    }

    async startStream(){
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        let videoTrack = stream.getVideoTracks()[0]
        let audioTrack = stream.getAudioTracks()[0]
        this.tracks.videoTrack = videoTrack
        this.tracks.audioTrack = audioTrack
        return this.tracks
    }
}