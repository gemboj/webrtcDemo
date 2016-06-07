function WebRTCAdapter(send, hostUsername, showError){
    var that = this;

    that.constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

    if(navigator.mozGetUserMedia){
        that.detectedBrowser = "mozilla";
        that.peerConnection = mozRTCPeerConnection;
        that.sessionDescription = mozRTCSessionDescription;
        that.iceCandidate = mozRTCIceCandidate;
        that.config = {'iceServers': [{'url': 'stun:23.21.150.121'}]};
    }
    else if(navigator.webkitGetUserMedia){
        that.detectedBrowser = "chrome";
        that.peerConnection = webkitRTCPeerConnection;
        that.sessionDescription = RTCSessionDescription;
        that.iceCandidate = RTCIceCandidate;
        that.config = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
    }
    that.sdpConstraints = {};

    that.isWebRtcSupported = function(){
        return !!that.detectedBrowser;
    };

    that.createDataChannelHost = function(receiverUsername){
        if(that.isWebRtcSupported()){
            var peerConnection = new that.peerConnection(that.config, that.constraints);

            peerConnection.onicecandidate = function(event){
                if(event.candidate){
                    var iceCandidate = {
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    send('webrtcIceCandidate', {sender: hostUsername, receiver: receiverUsername, iceCandidate: iceCandidate});
                }
            };

            var dataChannel = peerConnection.createDataChannel("sendDataChannel", {reliable: false});

            createOffer(peerConnection, receiverUsername);

            return {peerConnection: peerConnection, dataChannel: dataChannel};
        }
        else{
            showError("Cannot create peer connection");
        }
    };


    function createOffer(peerConnection, receiver){
        peerConnection.createOffer(function(sessionDescription){
            peerConnection.setLocalDescription(new that.sessionDescription(sessionDescription));
            send('webrtcOffer', {sender: hostUsername, receiver: receiver, description: sessionDescription});
        }, function(error){
            showError(error)
        }, that.sdpConstraints);
    }

    that.onOffer = function(sender, sessionDescription, onDataChannel){
        if(that.isWebRtcSupported()){
            var peerConnection = new that.peerConnection(that.config, that.constraints);
            peerConnection.setRemoteDescription(new that.sessionDescription(sessionDescription));

            peerConnection.ondatachannel = function(event){
                var channel = event.channel;

                onDataChannel(channel);
            };

            peerConnection.onicecandidate = function(event){
                if(event.candidate){
                    var iceCandidate = {
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    send('webrtcIceCandidate', {iceCandidate: iceCandidate, receiver: sender, sender: hostUsername});
                }
            };

            createAnswer(peerConnection, sender);

            return peerConnection;
        }
        else{
            send('webrtcError', {sender: hostUsername, receiver: sender});
        }
    };

    function createAnswer(peerConnection, host){
        peerConnection.createAnswer(function(sessionDescription){
            peerConnection.setLocalDescription(new that.sessionDescription(sessionDescription));
            send('webrtcAnswer', {sender: hostUsername, receiver: host, description: sessionDescription});
        }, function(error){
            showError(error)
        }, that.sdpConstraints);
    }

    that.onAnswer = function(sessionDescription, peerConnection){
        peerConnection.setRemoteDescription(new that.sessionDescription(sessionDescription));
    };

    that.onIceCandidate = function(peerConnection, iceCandidate){
        var candidate = new that.iceCandidate({sdpMLineIndex: iceCandidate.label, candidate: iceCandidate.candidate});
        peerConnection.addIceCandidate(candidate);
    };
}