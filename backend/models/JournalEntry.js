const mongoose = require("mongoose");

const JournalEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This links it to the User model
        required: true
    },
    date: {
        type: String,
        required: true // Format: YYYY-MM-DD (e.g., "2025-04-06")
    },
    entry: {
        type: String,
        required: true // The AI-generated journal text
    },
    
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model("JournalEntry", JournalEntrySchema);
