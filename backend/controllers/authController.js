// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({
                message: user.email === email ?
                    'Email already registered' :
                    'Username already taken'
            });
        }

        user = new User({ username, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login an existing user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};
