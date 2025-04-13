// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Registration attempt for:', email);

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({
                message: user.email === email ?
                    'Email already registered' :
                    'Username already taken'
            });
        }

        // Create new user - password will be hashed by the pre-save hook
        user = new User({ username, email, password });
        await user.save();
        console.log('User registered successfully:', email);

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
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
        console.log('Login attempt for:', email);

        if (!email || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user and select password field explicitly
        const user = await User.findOne({ email }).select('+password');
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found with email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        try {
            // Use the comparePassword method from the User model
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', isMatch);

            if (!isMatch) {
                console.log('Password mismatch for user:', email);
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        } catch (compareError) {
            console.error('Password comparison error:', compareError);
            return res.status(500).json({ message: 'Error verifying credentials' });
        }

        console.log('Login successful for:', email);
        user.lastLogin = new Date();
        await user.save();

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) {
                console.error('JWT Sign error:', err);
                return res.status(500).json({ message: 'Error generating token' });
            }
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        });
    } catch (err) {
        console.error('Login error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        res.status(500).json({ message: 'Server error during login' });
    }
};
