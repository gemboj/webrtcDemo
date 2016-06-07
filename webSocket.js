module.exports = function(server){
    var socketio = require('socket.io')(server),
         sockets = {};

    socketio.sockets.on('connection', function(socket) {
        var connectedUsername = socket.handshake.query.username;

        socket.on('send', function(){
            console.log("sending");
        });

        socket.on('disconnect', function () {
            delete sockets[connectedUsername];

            for(var username in sockets){
                sockets[username].emit("someoneLeft", connectedUsername);
            }
        });

        socket.on('error', function(error){
            console.trace(error);
        });

        socket.on('webrtcOffer', function(data){
            sockets[data.receiver].emit('webrtcOffer', data);
        });

        socket.on('webrtcError', function(data){
            sockets[data.receiver].emit('webrtcError', data);
        });

        socket.on('webrtcIceCandidate', function(data){
            sockets[data.receiver].emit('webrtcIceCandidate', data);
        });

        socket.on('webrtcAnswer', function(data){
            sockets[data.receiver].emit('webrtcAnswer', data);
        });

        var usernames = [];
        for(var username in sockets){
            usernames.push(username);

            sockets[username].emit("someoneJoined", connectedUsername);
        }


        socket.emit("joinedChat", usernames);

        usernames.push(connectedUsername);
        sockets[connectedUsername] = socket;
    });

};