"use strict"
const express = require('express')();
var http = require('http').Server(express);
const router = require('./routes');
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

let connectedUsers = 0;
let nickNames = []

express.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('disconnect', function(data){
    // connectedUsers--;
    connectedUsers = Object.keys(io.sockets.sockets).length
    updateConnectedUsers()
    if (!socket.nickname) {
        return
    }
    nickNames.splice(nickNames.indexOf(socket.nickname, 1));
    updateNickNames()
    updateChatMessage(false, socket.nickname)

  });

  function updateNickNames() {
    io.emit('username', nickNames)
  }

  function updateConnectedUsers() {
    io.emit('connected-users', connectedUsers);
  }

  function updateChatMessage(msg, username) {
    console.log('msg', msg, 'username', username);
    if (username) {
      if (msg) {
        io.emit('chat message', {data: 'joined....' , nick : username, isReturn : 1});
      }
      else{
        io.emit('chat message', {data: 'left...' , nick : username, isReturn : 1});
      }
    }
    else{
      io.emit('chat message', {data: msg , nick : socket.nickname, isReturn : 0});
    }

  }

  socket.on('chat message', function(msg){
    //socket.broadcast.emit('chat message', {data: msg , nick : socket.nickname});
    updateChatMessage(msg, null)
    // io.emit('chat message', {data: msg , nick : socket.nickname});
  });

  socket.on('new user', function (data, callback) {
    if (nickNames.indexOf(data) != -1) {
      callback(false)
    }
    else{
      callback(true)
      connectedUsers = Object.keys(io.sockets.sockets).length
      updateConnectedUsers()
      socket.nickname = data
      updateChatMessage(true, socket.nickname)
      nickNames.push(socket.nickname)
      updateNickNames()
    }
  })

  socket.on('connected-users', function () {
    updateConnectedUsers()
  })


});

http.listen(port, function(){
  console.log('listening on *:3000');
});
