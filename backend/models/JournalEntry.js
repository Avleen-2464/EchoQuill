const mongoose = require("mongoose");

const JournalEntrySchema = new mongoose.Schema({
    userId: String, 
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    entry: String,  // AI-generated diary entry
    mood: String,  // Overall mood (e.g., Happy, Thoughtful, Anxious)
    keyMoments: [String]  // Important moments from the conversation
});

module.exports = mongoose.model("JournalEntry", JournalEntrySchema);
