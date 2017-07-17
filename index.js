"use strict"
const express = require('express')();
var http = require('http').Server(express);
const router = require('./routes');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');


const Users = require('./db/user.js');
const Chat = require('./db/chat.js');

var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

let connectedUsers = 0;
let nickNames = []
let firstMessage = true;

express.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('disconnect', function(data){
    // connectedUsers--;

    connectedUsers = Object.keys(io.sockets.sockets).length
    if (connectedUsers === 0) {
        firstMessage = true;
    }
    updateConnectedUsers()
    if (!socket.nickname) {
        return
    }
    nickNames.splice(nickNames.indexOf(socket.nickname, 1));
    updateNickNames()
    updateUsers(socket.nickname)
    updateChatMessage(false, socket.nickname)
  });

  function updateUsers(username) {
    console.log('in update user');
    return new Promise(function(resolve, reject) {
        Users.find({"userName" : username}, function (err, result) {
          if (err) {
            reject({
              msg : "error"
            })
          }
          else{
            resolve({
              msg : result
            })
          }

        })
    })
    .then(data =>{
      return new Promise(function(resolve, reject) {
        Users.update({userName : data.msg[0].userName}, {"isActive" : false }, function (err) {
          if (err) {
            reject({
                msg : "error"
            })
            }
          else{
            resolve({
                msg : "success"
            })
          }
          })
      });

    } )

  }

  function updateNickNames() {
    io.emit('username', nickNames)
  }

  function updateConnectedUsers() {
    io.emit('connected-users', connectedUsers);
  }

  function updateChatMessage(msg, username) {
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
    if (!firstMessage) {
      updateConversation(msg)
      console.log("updateConversation invoked");
    }
    else{
      firstMessage = false
      initiateConversation(msg)
      console.log("initiateConversation invoked");
    }
    updateChatMessage(msg, null)

    // io.emit('chat message', {data: msg , nick : socket.nickname});
  });

  function updateConversation(msg) {
    console.log("inside updateConversation" , msg);
    new Promise(function(resolve, reject) {
      Chat.find().sort({_id:-1}).limit(1).exec(function (err,result) {
        if (err) {
          reject(console.log("updateConversation error"))
        }
        else{
          resolve({
            msg : result
          })
        }
      })
    })
    .then(result => {
      Chat.update({_id : result.msg[0]._id}, {$push : {
        conversationHistory : {
          from : socket.nickname,
          messages : msg
        }
      }}, function (err) {
          if (err) {
            console.log("error in updating");
          }
          else{
            console.log("success in updating");
          }
      })
    })
    .catch(result => {
      console.log("error occurred");
    })
  }

  function initiateConversation(msg) {
      console.log("inside initiat eConversation" , msg);
      var newConversation = Chat({
        conversationHistory : [{
          from : socket.nickname,
          messages : msg
        }]
      })
      newConversation.save(function (err) {
        if (err) {
          console.log("error in initiateConversation");
        }
        else {
          console.log("Success from initiateConversation");
        }

      })
  }

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
      insertUsers(data)
      .then(result => {
        console.log();
      })
      .catch(result => {
        console.log();
      })
    }
  })

  function insertUsers(username) {
    var user = new Users({
      "userName" : username,
      "isActive" : true
    })
    return new Promise(function(resolve, reject) {
      user.save(function (err) {
        if (err) {
          reject({
            message : "Error inserting user"
          })
        }
        else{
          resolve({
            message : "User inserted successfully"
          })
        }
      })
    });
  }

  socket.on('connected-users', function () {
    updateConnectedUsers()
  })


});

http.listen(port, function(){
  console.log('listening on *:3000');
});
