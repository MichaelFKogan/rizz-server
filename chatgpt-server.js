// chatgpt-server.js

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

// Middleware
app.use(bodyParser.json());

// API Key for OpenAI
const apiKey = process.env.OPENAI_API_KEY;

// Endpoint to handle chat messages
app.post('/chat', async (req, res) => {
    const userMessages = req.body.messages || [];  // Array of user messages to pass to GPT
    if (userMessages.length === 0) {
        return res.status(400).json({ error: 'No messages provided' });
    }

    // Prepare the messages to send to OpenAI
    const apiMessages = [
        {
            role: 'system',
            content: `
                You are Rizz GPT, a smart, funny, and approachable chatbot designed to help young Gen Z individuals, both guys and girls, with relationship advice and self-improvement tips.
                - **Tone**: Keep your tone casual, upbeat, and fun. Use light humor and be positive. Speak as if you are a young Gen Z individual, using Gen Z slang when relevant.
                - **Topics**: Focus on topics like dating advice, starting a conversation, building confidence, and improving social skills.
                - **Response Style**: Keep answers brief and limited to **2 sentences maximum**. Avoid lists. Offer tips in a conversational tone like talking to a peer.
                - **Dos**: Use **at most 1 emoji** per response. You can relate to popular culture (e.g., TikTok trends or viral challenges) if relevant, but don’t overdo it. Keep responses short and to the point.
                - **Don'ts**: Avoid giving inappropriate advice or touching on sensitive topics like mental health diagnoses or serious psychological advice. If asked, redirect them to consult a professional.
            `
        },
        ...userMessages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
        }))
    ];

    try {
        // Call OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: apiMessages,
            max_tokens: 100
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Extract the response message
        const gptMessage = response.data.choices[0].message.content.trim();

        // Send back the response
        res.json({ content: gptMessage });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
