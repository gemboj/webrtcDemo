module.exports = function(server){
    var socketio = require('socket.io')(server),
         sockets = {};

    socketio.sockets.on('connection', function(socket) {
        var connectedUsername = socket.handshake.query.username;

        socket.on('disconnect', function () {
            delete sockets[connectedUsername];

            for(var username in sockets){
                sockets[username].socket.emit("someoneLeft", connectedUsername);
            }
        });

        socket.on('error', function(error){
            console.trace(error);
        });

        socket.on('webrtcOffer', function(data){
            sockets[data.receiver].socket.emit('webrtcOffer', data);
        });

        socket.on('webrtcAnswer', function(data){
            sockets[data.receiver].socket.emit('webrtcAnswer', data);
        });

        socket.on('webrtcIceCandidate', function(data){
            sockets[data.receiver].socket.emit('webrtcIceCandidate', data);
        });

        socket.on('webrtcError', function(data){
            sockets[data.receiver].socket.emit('webrtcError', data);
        });



        var usernames = [];
        for(var username in sockets){
            usernames.push({username: username});

            sockets[username].socket.emit("someoneJoined", {username: connectedUsername});
        }

        socket.emit("usersList", usernames);

        sockets[connectedUsername] = {};
        sockets[connectedUsername].socket = socket;
    });

};