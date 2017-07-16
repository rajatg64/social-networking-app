$(function (){
  var socket = io();
  socket.emit('connected-users');

  socket.on('connected-users', function (connectedUsers) {
    console.log(connectedUsers);
    $('#userCount').text('Online Users : '+connectedUsers);
  })

  $('form').submit(function (){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
    window.scrollTo(0, document.body.scrollHeight);
  });
});
