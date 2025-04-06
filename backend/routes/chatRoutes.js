// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { handleChat } = require('../controllers/chatController');

// @route   POST api/chat
// @desc    Send message to Llama and get response
// @access  Private
router.post('/', auth, handleChat);

module.exports = router;
