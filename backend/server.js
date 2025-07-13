const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // logs requests to console

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatbotRoutes);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
    });

    // Global error handler (optional)
    app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack || err.message);
    res.status(500).json({ msg: 'Internal server error' });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    });
    