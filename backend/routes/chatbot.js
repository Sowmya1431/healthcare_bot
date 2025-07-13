const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.userId || req.user.id;

    // ✅ Validate prompt
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ msg: 'Prompt is required and must be a non-empty string.' });
    }

    try {
        // ✅ You can make the note optional if needed (remove this line to avoid restriction)
        const refinedPrompt = `User says: "${prompt}"

Please respond helpfully and clearly. End your reply with this note:
"Note: I'm specialized in healthcare. Please ask me medical-related questions too!"`;

        const geminiRes = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
            {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: refinedPrompt }]
                        
                    }
                ]
            },
            {
                params: { key: process.env.GEMINI_API_KEY },
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            }
        );

        const finalResponse =
            geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response received.';

        // ✅ Save to chat history
        await new Chat({ userId, question: prompt.trim(), response: finalResponse }).save();

        res.json({ response: finalResponse });

    } catch (err) {
        console.error('❌ Gemini API Error:', err.response?.data || err.message || err);
        res.status(500).json({ msg: 'Something went wrong while processing your request.' });
    }

    router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const chats = await Chat.find({ userId }).sort({ createdAt: 1 });

        res.json({ chats });
    } catch (err) {
        console.error('❌ Error fetching chat history:', err);
        res.status(500).json({ msg: 'Failed to load chat history.' });
    }
});

});

module.exports = router;
