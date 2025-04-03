const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'neutral', 'anxious', 'excited'],
    default: 'neutral'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for faster queries
journalSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Journal', journalSchema); 