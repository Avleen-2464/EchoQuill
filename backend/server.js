const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require("axios");
const { exec } = require("child_process");
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));

// Middleware
app.use(express.json());

// Debug logs for routes
console.log('Loading routes...');
const authRoutes = require('./routes/authRoutes');
console.log('Auth routes loaded:', typeof authRoutes);
const chatRoutes = require('./routes/chatRoutes');
console.log('Chat routes loaded:', typeof chatRoutes);
const journalRoutes = require('./routes/journalRoutes');
console.log('Journal routes loaded:', typeof journalRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const startOllama = () => {
  exec("ollama serve", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting Ollama: ${error.message}`);
      return;
    }
    if (stderr) {
      console.warn(`Ollama Warning: ${stderr}`);
    }
    console.log(`Ollama Started: ${stdout}`);
  });
};

// Check if Ollama is running properly
const checkOllama = async () => {
  try {
    const response = await axios.get("http://localhost:11434/api/tags");
    if (response.status === 200) {
      console.log("✅ Ollama is already running.");
    }
  } catch (error) {
    console.log("❌ Ollama is not running. Starting it now...");
    startOllama();
  }
};

checkOllama();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/journals', journalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
