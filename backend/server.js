// backend/server.js
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://gemini-dialogue-app.netlify.app' // YOUR ACTUAL DEPLOYED NETLIFY URL
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
            callback(new Error(`Origin ${origin} not allowed by CORS.`), false);
        }
    }
}));
// --- End CORS Configuration ---

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});

// Keep your existing '/api/ask-gemini' if you used it for the simple dialogue app
// app.post('/api/ask-gemini', async (req, res) => { /* ... */ });


// THIS IS THE CORRECTED ENDPOINT FOR ESL QUESTIONS
app.post('/api/generate-esl-questions', async (req, res) => {
    try {
        // Destructure the expected fields from the frontend
        const { topic, level, structure, count = 40, questionType = "open_ended" } = req.body;

        if (!topic || !level || !structure) {
            return res.status(400).json({ error: "Topic, level, and structure are required." });
        }

        // Construct the detailed prompt for Gemini
        const detailedPrompt = `
            You are an ESL curriculum assistant. Generate ${count} ESL practice questions.
            Topic: ${topic}
            Grammar/Structure Focus: ${structure}
            Student Level: ${level} (e.g., A1 - Beginner, B2 - Intermediate)
            Question Type: ${questionType} (These should encourage full sentence answers, not just yes/no or single words).

            Instructions:
            1. Each question must be directly related to the topic, grammar/structure, and appropriate for the student level.
            2. For "${questionType}" questions, ensure they are truly open and cannot be easily answered with a single word or simple "yes/no". They should prompt the student to formulate a response.
            3. If the structure input implies a visual or situational context (e.g., "What do you like? + 🍎" or "Describe a picture of a park"), formulate questions that evoke this context. For example: "Imagine you see a picture of an apple. Using the structure 'I like...', tell me about the apple." or "If you were at a park, what would you typically do there, using past simple verbs?"
            4. The language complexity, vocabulary, and sentence length must be suitable for the specified student level.

            Output Format:
            Return ONLY a valid JSON array of objects. Each object in the array must have exactly one key: "text", whose value is the question string.
            Example of a single object in the array:
            {"text": "What are three things you usually do on weekends?"}

            Do not include any introductory text, explanations, numbering, or markdown formatting like \`\`\`json or \`\`\` outside the JSON array itself. The entire response must be the JSON array.
        `;

        console.log(`[Backend /api/generate-esl-questions] Generating ${count} '${questionType}' questions. Topic: ${topic}, Level: ${level}, Structure: ${structure}`);
        // console.log("[Backend] Full prompt to Gemini:", detailedPrompt); // Optional: log the full prompt for debugging

        const result = await model.generateContent(detailedPrompt); // Use the detailedPrompt
        const gResponse = result.response;
        const responseText = gResponse.text();

        console.log("[Backend /api/generate-esl-questions] Raw Gemini response snippet:", responseText.substring(0, 200) + "...");

        let questionsArray;
        try {
            const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
            questionsArray = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[Backend] Failed to parse Gemini response for ESL questions:", parseError, "Raw text was:", responseText);
            return res.status(500).json({ error: "Failed to parse questions from AI.", rawResponse: responseText });
        }

        if (!Array.isArray(questionsArray) || (questionsArray.length > 0 && typeof questionsArray[0].text === 'undefined')) {
            console.error("[Backend] Parsed ESL questions response is not an array or has incorrect object structure:", questionsArray);
            return res.status(500).json({ error: "AI response was not a valid question array or had incorrect object structure." });
        }
        
        console.log(`[Backend] Successfully generated ${questionsArray.length} ESL questions.`);
        res.json(questionsArray);

    } catch (error) {
        console.error("[Backend] Error in /api/generate-esl-questions:", error);
        if (error.response && error.response.data) {
            return res.status(500).json({ error: 'Error from AI service.', details: error.response.data });
        }
        res.status(500).json({ error: 'Internal server error while generating ESL questions.' });
    }
});

const PORT = process.env.PORT || 10000; // Or 3001, ensure consistency with .env if present
app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`); // This log is for local; Render uses its own port
    console.log(GEMINI_API_KEY ? "Gemini API Key loaded successfully." : "Gemini API Key NOT FOUND in .env file!");
});