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
        const { topic, level, structure, count = 40 } = req.body; // questionType removed, it's now implied

        if (!topic || !level || !structure) {
            return res.status(400).json({ error: "Topic, level, and structure are required." });
        }

        const prompt = `
            You are an ESL game designer. Generate ${count} unique ESL scenario-based multiple-choice questions for students.
            Each question should immerse the student in a situation related to the chosen "Topic".
            The language and complexity must be suitable for the "Student Level".
            The "Grammar/Structure Focus" should be subtly incorporated into the question or the scenario if appropriate, or can guide the overall theme of the scenarios.

            For each question, provide:
            1.  The main question text ("text").
            2.  Exactly three answer options ("options"). Each option is an object with:
                a.  "optionText": The text for the answer button (e.g., "Choose the banana").
                b.  "consequenceText": A short, engaging sentence describing the outcome of choosing this option.
                c.  "move": An integer representing steps to move. Can be positive (forward), negative (backward), or 0 (stay). Examples: +1, -2, 0. Keep movement small, between -2 and +2.

            Criteria:
            - Topic: ${topic}
            - Student Level: ${level} (e.g., A1 - Beginner, B2 - Intermediate)
            - Grammar/Structure Focus: ${structure}

            Output Format:
            Return ONLY a valid JSON array of question objects.
            Each question object in the array must have "text" (string) and "options" (array of 3 option objects).
            Each option object must have "optionText" (string), "consequenceText" (string), and "move" (integer).

            Example of a single question object in the array:
            {
              "text": "You're at a fruit stand feeling hungry. Which fruit do you pick?",
              "options": [
                {
                  "optionText": "The big watermelon",
                  "consequenceText": "It's too heavy to carry far! You rest. Stay in place.",
                  "move": 0
                },
                {
                  "optionText": "The ripe banana",
                  "consequenceText": "Delicious and energizing! Move forward 1 step.",
                  "move": 1
                },
                {
                  "optionText": "The slightly green apple",
                  "consequenceText": "It's a bit sour and you get a tummy ache! Go back 1 step.",
                  "move": -1
                }
              ]
            }

            Do not include any introductory text, explanations, numbering, or markdown formatting like \`\`\`json or \`\`\` outside the JSON array itself.
            The entire response must be the JSON array. Ensure all requested fields are present for every question and option.
        `;

        console.log(`[Backend] Generating ${count} multiple-choice ESL questions. Topic: ${topic}, Level: ${level}, Structure: ${structure}`);

        const result = await model.generateContent(prompt);
        const gResponse = result.response; // Renamed to avoid conflict
        const responseText = gResponse.text();

        console.log("[Backend] Raw Gemini response snippet for ESL questions:", responseText.substring(0, 300) + "...");

        let questionsArray;
        try {
            const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
            questionsArray = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[Backend] Failed to parse Gemini response for ESL questions:", parseError, "Raw text was:", responseText);
            return res.status(500).json({ error: "Failed to parse questions from AI.", rawResponse: responseText });
        }

        // Deeper validation of the structure
        if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
            console.error("[Backend] Parsed response is not an array or is empty:", questionsArray);
            return res.status(500).json({ error: "AI response was not a valid non-empty question array.", rawResponse: responseText });
        }
        const firstQuestion = questionsArray[0];
        if (typeof firstQuestion.text !== 'string' || !Array.isArray(firstQuestion.options) || firstQuestion.options.length !== 3) {
            console.error("[Backend] First question object has incorrect structure (text or options array):", firstQuestion);
            return res.status(500).json({ error: "AI returned questions with incorrect main structure.", rawResponse: responseText });
        }
        const firstOption = firstQuestion.options[0];
        if (typeof firstOption.optionText !== 'string' || typeof firstOption.consequenceText !== 'string' || typeof firstOption.move !== 'number') {
            console.error("[Backend] First option object has incorrect structure:", firstOption);
            return res.status(500).json({ error: "AI returned options with incorrect structure.", rawResponse: responseText });
        }
        
        console.log(`[Backend] Successfully generated and validated ${questionsArray.length} ESL questions.`);
        res.json(questionsArray);

    } catch (error) {
        console.error("[Backend] Error in /api/generate-esl-questions:", error);
        if (error.response && error.response.data) {
            return res.status(500).json({ error: 'Error from AI service.', details: error.response.data });
        }
        res.status(500).json({ error: 'Internal server error while generating ESL questions.' });
    }
});

const PORT = process.env.PORT || 3001; // Or your preferred port
app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
    console.log(GEMINI_API_KEY ? "Gemini API Key loaded successfully." : "Gemini API Key NOT FOUND in .env file!");
});