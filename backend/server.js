// backend/server.js
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173', // For local Vite frontend development
    'https://gemini-dialogue-app.netlify.app' // Your deployed Netlify frontend URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Add a log to see what origin is being blocked
            console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    }
}));
// --- End CORS Configuration ---

app.use(express.json()); // Middleware to parse JSON request bodies

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1); // Exit if API key is missing
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // Or your preferred model
    safetySettings: [ // Example safety settings
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});

// Define an API endpoint
app.post('/api/generate-esl-questions', async (req, res) => {
    try {
        const { userPrompt } = req.body; // Get prompt from request body

        if (!userPrompt) {
            return res.status(400).json({ error: "userPrompt is required in the request body." });
        }

        console.log(`[Backend] Received prompt: "${userPrompt}"`);

        const result = await model.generateContent(userPrompt);
        const response = result.response;
        const text = response.text();

        console.log("[Backend] Gemini response snippet:", text.substring(0, 100) + "...");
        res.json({ reply: text }); // Send Gemini's response back to the frontend

    } catch (error) {
        console.error("[Backend] Error calling Gemini API:", error);
        res.status(500).json({ error: "Failed to get response from AI due to a server error." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
    console.log(GEMINI_API_KEY ? "Gemini API Key loaded successfully." : "Gemini API Key NOT FOUND in .env file!");
});