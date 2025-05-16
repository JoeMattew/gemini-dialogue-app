// backend/server.js
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173', // Vite default dev port for frontend
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
    model: "gemini-1.5-flash-latest", // Or your preferred model
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});

// Keep your existing '/api/ask-gemini' for simple dialogue if you want
app.post('/api/ask-gemini', async (req, res) => {
    try {
        const { userPrompt } = req.body;
        if (!userPrompt) return res.status(400).json({ error: "userPrompt is required." });
        console.log(`[Backend /api/ask-gemini] Received prompt: "${userPrompt}"`);
        const result = await model.generateContent(userPrompt);
        const gResponse = result.response; // Renamed to avoid conflict
        const text = gResponse.text();
        console.log("[Backend /api/ask-gemini] Gemini response snippet:", text.substring(0,100)+"...");
        res.json({ reply: text });
    } catch (error) {
        console.error("[Backend /api/ask-gemini] Error:", error);
        res.status(500).json({ error: "Failed to get response from AI." });
    }
});

// MODIFIED ENDPOINT FOR ESL MULTIPLE CHOICE CONSEQUENCE QUESTIONS
app.post('/api/generate-esl-questions', async (req, res) => {
    try {
        const { topic, level, structure, count = 40 } = req.body;

        if (!topic || !level || !structure) {
            return res.status(400).json({ error: "Topic, level, and structure are required." });
        }

        // --- Start Prompt Engineering ---
        let levelSpecificInstructions = "";
        let structureFocusInstruction = `The questions should subtly incorporate or test the grammar/structure: "${structure}".`;

        if (level.toUpperCase().includes("A1") || level.toUpperCase().includes("A2")) {
            levelSpecificInstructions = `
                Use VERY SIMPLE vocabulary and sentence structures suitable for A1-A2 absolute beginner to elementary ESL learners.
                Sentences should be short and direct. Avoid idioms, complex tenses (unless explicitly the focus), and uncommon words.
                For A1, try to make many questions follow a highly consistent grammatical pattern related to the "${structure}" if it's a simple pattern. For example, if the structure is "What is this?", many questions could be "What is this [noun related to topic]?".
                For A2, you can introduce slightly more variation while still keeping language very simple and clear.
            `;
            if (structure.toLowerCase().includes("what is this") || structure.toLowerCase().includes("what are these")) {
                structureFocusInstruction = `Most questions should follow the pattern "${structure} ..." using vocabulary related to the topic "${topic}". The answer options will then provide choices related to this pattern.`;
            } else if (structure.toLowerCase().includes("i like") || structure.toLowerCase().includes("i don't like")) {
                 structureFocusInstruction = `Most questions should set up a scenario where the student can express preference using "I like..." or "I don't like..." based on the options, related to the topic "${topic}". Example: "You see a food item. Do you like it?". The options will then be foods.`;
            }
            // Add more specific structure handling for A1/A2 if needed
        } else if (level.toUpperCase().includes("B1")) {
            levelSpecificInstructions = `
                Use vocabulary and sentence structures suitable for B1 pre-intermediate ESL learners.
                Sentences can be slightly more complex than A1/A2 but should still be clear.
            `;
        } else { // B2, C1
            levelSpecificInstructions = `
                Use vocabulary and sentence structures appropriate for ${level} ESL learners.
                More complex sentence structures and a wider range of vocabulary can be used.
            `;
        }

        const prompt = `
            You are an ESL game designer. Generate ${count} unique ESL scenario-based multiple-choice questions.

            Target Audience & Content Constraints:
            - Topic: ${topic}
            - Student Level: ${level}
            - Grammar/Structure Focus: ${structure}
            ${levelSpecificInstructions}
            ${structureFocusInstruction}

            For each question, provide:
            1.  "text": The main question text (the scenario or direct question).
            2.  "options": An array of exactly three option objects. Each option object must have:
                a.  "optionText": The text for the answer button (e.g., "A banana", "Yes, I do", "Go to the park"). This text should be simple and clear, especially for lower levels.
                b.  "consequenceText": A short, engaging sentence describing the outcome of choosing this option. This text should also be level-appropriate.
                c.  "move": An integer representing steps to move on a game board. Values should be between -2 and +2 (e.g., -2, -1, 0, 1, 2).

            Output Format:
            Return ONLY a valid JSON array of question objects.
            Each question object in the array must have "text" (string) and "options" (array of 3 option objects).
            Each option object must have "optionText" (string), "consequenceText" (string), and "move" (integer).

            Example of a single question object for an A1 level on "Food" with structure "What is this?":
            {
              "text": "You see a yellow fruit. Your friend asks: What is this?",
              "options": [
                {
                  "optionText": "It's a banana.",
                  "consequenceText": "Correct! You get a tasty banana. Move forward 1 step.",
                  "move": 1
                },
                {
                  "optionText": "It's an apple.",
                  "consequenceText": "Oops, that's not quite right for a yellow fruit like this! Go back 1 step.",
                  "move": -1
                },
                {
                  "optionText": "It's a carrot.",
                  "consequenceText": "A carrot is a vegetable! Stay here and think about fruits.",
                  "move": 0
                }
              ]
            }

            Example for B1 level on "Travel" with structure "Past Simple for experiences":
            {
                "text": "Your friend asks about your last holiday. What did you do?",
                "options": [
                    {
                        "optionText": "I visited a museum.",
                        "consequenceText": "Great! You learned something new. Move forward 2 steps.",
                        "move": 2
                    },
                    {
                        "optionText": "I lose my passport.",
                        "consequenceText": "Oh no, that's incorrect grammar! That caused a delay. Go back 1 step.",
                        "move": -1
                    },
                    {
                        "optionText": "I was staying at home.",
                        "consequenceText": "Staying home is relaxing, but no travel points this time! Stay in place.",
                        "move": 0
                    }
                ]
            }

            Do not include any introductory text, explanations, numbering, or markdown formatting like \`\`\`json or \`\`\` outside the JSON array itself.
            The entire response must be the JSON array. Ensure all requested fields are present and correctly typed for every question and option.
        `;
        // --- End Prompt Engineering ---

        console.log(`[Backend] Generating ${count} ESL MCQs. Topic: ${topic}, Level: ${level}, Structure: ${structure}`);
        // For debugging the prompt: console.log("Full prompt to Gemini:\n", prompt);

        const result = await model.generateContent(prompt);
        const gResponseII = result.response; // Renamed to avoid conflict
        const responseText = gResponseII.text();

        console.log("[Backend] Raw Gemini response snippet:", responseText.substring(0, 300) + "...");

        let questionsArray;
        try {
            const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
            questionsArray = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[Backend] Failed to parse Gemini response:", parseError, "Raw text was:", responseText);
            return res.status(500).json({ error: "Failed to parse questions from AI.", rawResponse: responseText });
        }

        if (!Array.isArray(questionsArray) || questionsArray.length === 0 || !questionsArray[0].text || !Array.isArray(questionsArray[0].options) || questionsArray[0].options.length !== 3 || typeof questionsArray[0].options[0].move !== 'number' ) {
            console.error("[Backend] Parsed response has incorrect structure:", questionsArray.slice(0,1));
            return res.status(500).json({ error: "AI response had incorrect structure.", rawResponse: responseText });
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

const PORT = process.env.PORT || 3001; // Ensure this matches your .env or Render's injected PORT
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`); // More generic log for deployed env
    console.log(GEMINI_API_KEY ? "Gemini API Key loaded successfully." : "Gemini API Key NOT FOUND in .env file!");
});