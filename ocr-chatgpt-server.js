const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (if needed)

// OCR endpoint to process image and return GPT-4 response
app.post('/process-image', async (req, res) => {
    if (!req.body.text) {
        return res.status(400).send('No text provided.');
    }

    const userText = req.body.text;
    try {
        // Fetch GPT-4 response
        const gptResponse = await fetchGPTResponse(userText);
        res.json({ extractedText: userText, gptResponse: gptResponse });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('An error occurred while processing the image.');
    }
});

// Function to fetch GPT-4 response based on the text from the client
async function fetchGPTResponse(userInput) {
    const apiKey = process.env.OPENAI_API_KEY; // This should be in your .env file
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const body = {
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `
                    You are Rizz GPT, a smart, funny, and approachable chatbot designed to help young Gen Z individuals, both guys and girls, with relationship advice, especially in dating scenarios.
                    Users will upload screenshots of text conversations or dating app chats (like Tinder or Hinge), and you will provide them with the best possible response.
                    Keep responses brief (2 sentences max) and use a casual, upbeat tone. Use light humor, and 1 emoji is allowed per response.
                `,
            },
            { role: 'user', content: `Here’s the image text: "${userInput}". Respond with a witty message for a dating situation.` },
        ],
        max_tokens: 100,
    };

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    };

    try {
        const result = await axios.post(apiUrl, body, { headers });
        return result.data.choices[0].message.content; // Return the GPT-4 response
    } catch (error) {
        console.error('Error fetching GPT-4 response:', error);
        return 'Sorry, I couldn’t generate a response at the moment.';
    }
}

app.listen(port, () => {
    console.log(`OCR ChatGPT Server running at http://localhost:${port}`);
});
