var mongoose = require('mongoose');
var connection = mongoose.connect('mongodb://localhost/chat');

var userSchema = new mongoose.Schema({
  userName : String,
  isActive : Boolean,
  createdAt : { type: Date, default: Date.now }
})

var Users = mongoose.model('Users', userSchema);

module.exports = Users
