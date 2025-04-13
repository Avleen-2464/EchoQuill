// routes/auth.js or routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   GET api/auth/test
// @desc    Test auth route
// @access  Public
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

module.exports = router;
