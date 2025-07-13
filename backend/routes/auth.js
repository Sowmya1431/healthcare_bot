const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const TOKEN_EXPIRY = '1h';

// ✅ POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required.' });
        }

        email = email.trim().toLowerCase();
        password = password.trim();

        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ msg: 'User registered successfully.' });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ msg: 'Server error during registration.' });
    }
});

// ✅ POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required.' });
        }

        email = email.trim().toLowerCase();
        password = password.trim();

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: TOKEN_EXPIRY,
        });

        res.json({ token });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ msg: 'Server error during login.' });
    }
});

module.exports = router;
