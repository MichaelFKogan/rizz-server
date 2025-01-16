// ocr-chatgpt-server.js

const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware to handle file uploads with a temporary destination
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/tmp'); // Save files in the /tmp directory (available in serverless environments)
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename for each file
    },
  });
  
  const upload = multer({ storage: storage });

// Serve static files (e.g., images)
app.use(express.static('uploads'));


// OCR endpoint to process image and return GPT-4 response
app.post('/process-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image uploaded.');
    }

    const imagePath = path.join(__dirname, req.file.path);

    try {
        // Initialize Tesseract worker
        // const worker = await createWorker("eng")

        const worker = await createWorker({
            wasmPath: '/tesseract-core-simd.wasm', // Path to the wasm file in the public folder
          });
          

        // const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        // Perform OCR on the uploaded image
        const { data: { text } } = await worker.recognize(imagePath);

        // Remove the uploaded file after processing
        fs.unlinkSync(imagePath);

        // Send the extracted text to GPT-4 API
        const response = await fetchGPTResponse(text);

        res.json({ extractedText: text, gptResponse: response });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('An error occurred while processing the image.');
    }
});

// Function to fetch GPT-4 response based on the OCR extracted text
async function fetchGPTResponse(userInput) {
    const apiKey = process.env.OPENAI_API_KEY;
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
        return result.data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching GPT-4 response:', error);
        return 'Sorry, I couldn’t generate a response at the moment.';
    }
}

app.listen(port, () => {
    console.log(`OCR ChatGPT Server running at http://localhost:${port}`);
});
