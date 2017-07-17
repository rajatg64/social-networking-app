var mongoose = require('mongoose');
var connection = mongoose.connect('mongodb://localhost/chat');

var conversationSchema = new mongoose.Schema({
  conversationHistory : [{
    from : String,
    messages : String,
    createdAt : { type: Date, default: Date.now}
  }],
    createdAt : { type: Date, default: Date.now}
})

var conversations = mongoose.model('conversations', conversationSchema);

module.exports = conversations
