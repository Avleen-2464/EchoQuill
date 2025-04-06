const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation' // or just String if you're not using a Conversation model
    },
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours
    }
});

module.exports = mongoose.model("Message", MessageSchema);
