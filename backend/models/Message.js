const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: String,  
    conversationId: String,  
    sender: String, // "user" or "bot"
    text: String,  
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
