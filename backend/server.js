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
    // Add any other origins you need to allow
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

// Original simple dialogue endpoint (optional, keep if used)
app.post('/api/ask-gemini', async (req, res) => {
    try {
        const { userPrompt } = req.body;
        if (!userPrompt) return res.status(400).json({ error: "userPrompt is required." });
        console.log(`[Backend /api/ask-gemini] Received prompt: "${userPrompt}"`);
        const result = await model.generateContent(userPrompt);
        const gResponse = result.response;
        const text = gResponse.text();
        console.log("[Backend /api/ask-gemini] Gemini response snippet:", text.substring(0,100)+"...");
        res.json({ reply: text });
    } catch (error) {
        console.error("[Backend /api/ask-gemini] Error:", error);
        res.status(500).json({ error: "Failed to get response from AI." });
    }
});

// REFINED ENDPOINT FOR ESL MULTIPLE CHOICE CONSEQUENCE QUESTIONS
app.post('/api/generate-esl-questions', async (req, res) => {
    try {
        const { topic, level, structure, count = 40 } = req.body;

        if (!topic || !level || !structure) {
            return res.status(400).json({ error: "Topic, level, and structure are required." });
        }

        // --- Start Advanced Prompt Engineering ---
        let personaInstruction = `
            You are an expert ESL curriculum designer and a creative storyteller, creating content for an educational adventure board game.
            Players are on a journey and encounter various situations.
            Your output MUST be a JSON array of question objects. No other text.
        `;

        let levelSpecificGuidance = "";
        let structureDrillingInstruction = "";
        let narrativeGuidance = `
            **Narrative Consistency (Loose Thematic Journey):**
            -   Try to create a very loose sense of progression or a journey across the ${count} questions.
            -   Some questions can subtly reference potential outcomes or items from a *hypothetical* previous question, creating a light thematic link.
            -   For example: If a question involves finding an apple, a later question (not necessarily the immediate next one) could involve what to do with an apple.
            -   The tone should be engaging, sometimes funny, and appropriate for children or young ESL learners.
            -   If the topic is "A Day at the Zoo", questions could progress from entering, seeing different animals, to leaving.
        `;
        let moveDistributionGuidance = `
            **Movement Value Distribution Requirement:**
            For the "move" value in each option's consequence, you MUST ensure a balanced distribution. Approximately:
            -   25% of options should have "move": 0 (stay in place).
            -   25% of options should have "move": 1 (move forward 1).
            -   25% of options should have "move": -1 (move backward 1).
            -   The remaining 25% can be "move": 2 or "move": -2, or a mix of 0, 1, -1.
            -   It is CRITICAL that there are negative moves and zero moves, not just positive ones. Ensure good variety.
        `;

        // Tailor guidance for A1/A2 levels
        if (level.toUpperCase().includes("A1") || level.toUpperCase().includes("A2")) {
            levelSpecificGuidance = `
                **Strict Language Simplicity for ${level}:**
                -   Vocabulary: Use ONLY common CEFR A1-A2 words. For A1, focus on the most basic A1 vocabulary.
                -   Sentence Structure: Keep sentences VERY short and direct (e.g., Subject-Verb-Object). Use primarily Present Simple. Avoid complex conjunctions. Max 5-8 words per sentence for A1 questions and options if possible.
                -   Avoid: Idioms, most phrasal verbs (only very common ones like 'get up', 'look at'), complex tenses (unless "${structure}" specifically requires it and it's an A2 focus on a very simple tense), passive voice, and figurative language.
                -   Clarity: Questions, option texts, and consequence texts MUST be extremely unambiguous for a beginner/elementary learner.
            `;

            const likePatternMatch = structure.match(/i like (\[?\w+\]?)/i);
            const whatIsThisPatternMatch = structure.toLowerCase().includes("what is this") || structure.toLowerCase().includes("what's this") || structure.toLowerCase().includes("what are these");

            if (likePatternMatch) {
                const itemCategory = likePatternMatch[1].replace(/[\[\]]/g, ''); // e.g., "animal", "fruit", "lions"
                structureDrillingInstruction = `
                    **Structure Drilling for "I like [${itemCategory}]" (Topic: "${topic}"):**
                    -   A significant portion of the ${count} questions (e.g., 50-75%) MUST follow this pattern:
                    -   The "text" should present a scenario involving an item from the "${topic}" category that relates to "${itemCategory}".
                    -   The "optionText" for the three choices MUST feature DIFFERENT specific examples from the "${topic}" category. For instance, if topic is "Animals" and structure is "I like lions", options should be VARIED animals (e.g., "a tiger", "an elephant", "a monkey"), not just "a lion" repeatedly. The goal is to practice the "I like..." structure with diverse vocabulary from the topic.
                    -   The "consequenceText" can then reflect a simple positive/negative outcome based on a hypothetical preference for the chosen option.
                    -   Example (A1, Topic: "Pets", Structure: "I like [pet]"):
                        "text": "You visit a pet shop. You see many animals. Which one do you want to pet?",
                        "options": [
                          { "optionText": "A fluffy cat", "consequenceText": "The cat purrs! You like cats. Move +1.", "move": 1 },
                          { "optionText": "A playful dog", "consequenceText": "The dog wags its tail! It's friendly. Move +1.", "move": 1 },
                          { "optionText": "A quiet fish", "consequenceText": "The fish just swims. Maybe another time. Stay here.", "move": 0 }
                        ]
                `;
            } else if (whatIsThisPatternMatch) {
                 structureDrillingInstruction = `
                    **Structure Drilling for "What is this/these?" (Topic: "${topic}"):**
                    -   A significant portion of the ${count} questions (e.g., 50-75%) MUST follow this pattern:
                    -   The "text" describes or points to an item from the "${topic}" category, ending with a question like "What is this?" or "What are these?".
                    -   The "optionText" for the three choices MUST be names of DIFFERENT items from the "${topic}", one being correct.
                    -   Example (A1, Topic: "Classroom", Structure: "What is this?"):
                        "text": "Look! On the table. It's red. You write with it. What is this?",
                        "options": [
                          { "optionText": "It's a pencil.", "consequenceText": "Yes! Good job. Move +1.", "move": 1 },
                          { "optionText": "It's a book.", "consequenceText": "Not this time. Try again! Go back -1.", "move": -1 },
                          { "optionText": "It's a bag.", "consequenceText": "Close! But not quite. Stay here.", "move": 0 }
                        ]
                 `;
            } else { // General A1/A2 structure drilling if no specific pattern matched
                structureDrillingInstruction = `
                    **Structure Focus for ${level} (Topic: "${topic}", Structure: "${structure}"):**
                    -   For A1/A2, ensure a large number of questions (e.g., 50-75%) directly and simply use the target grammatical structure: "${structure}".
                    -   Repeat the core sentence pattern of the "${structure}" across these questions, primarily changing the key vocabulary related to the "${topic}".
                    -   This is for drilling the specific structure with varied topic vocabulary.
                `;
            }
        } else { // B1 and above - more flexibility
            levelSpecificGuidance = `Language Complexity for ${level}: Use CEFR ${level} appropriate vocabulary and sentence structures. More complex scenarios and choices are welcome.`;
            structureDrillingInstruction = `Structure Focus for ${level}: The questions should provide natural and varied contexts for using or understanding the grammatical structure: "${structure}". Explore different facets of the structure.`;
        }

        const prompt = `
            ${personaInstruction}

            **Overall Goal: Generate ${count} unique ESL game questions.**

            **Key Instructions (Strict Adherence Required):**
            1.  **Topic Focus:** All scenarios MUST revolve around: "${topic}".
            2.  **Student Level:** Language (vocabulary, grammar, sentence length) in questions, options, and consequences MUST be strictly appropriate for: "${level}".
                ${levelSpecificGuidance}
            3.  **Grammar/Structure Focus:**
                ${structureDrillingInstruction}
            4.  **Narrative & Tone:**
                ${narrativeGuidance}
            5.  **Movement Values:**
                ${moveDistributionGuidance}
            6.  **Multiple Choice Options & Consequences:**
                -   Each question MUST have exactly three "options".
                -   "optionText" should be concise, clear, and level-appropriate.
                -   "consequenceText" should be short, engaging, sometimes funny, and level-appropriate.
                -   "move" MUST be an integer: -2, -1, 0, 1, or 2.

            **Output Format (CRITICAL - ONLY the JSON array):**
            Return a valid JSON array of question objects. Each object MUST have "text" (string) and "options" (array of 3 option objects). Each option object MUST have "optionText" (string), "consequenceText" (string), and "move" (integer). No extra text, no explanations, no markdown like \`\`\`json.

            Begin.
        `;
        // --- End Advanced Prompt Engineering ---

        console.log(`[Backend] Generating ${count} ESL MCQs. Topic: "${topic}", Level: "${level}", Structure: "${structure}"`);
        // For comprehensive prompt debugging:
        // if (process.env.NODE_ENV === 'development') { // Only log full prompt in dev
        //    console.log("-------------------- FINAL PROMPT TO GEMINI --------------------");
        //    console.log(prompt);
        //    console.log("-----------------------------------------------------------------");
        // }


        const result = await model.generateContent(prompt);
        const gResponseII = result.response; // Renamed to avoid conflict
        const responseText = gResponseII.text();

        console.log("[Backend] Raw Gemini response snippet (first 300 chars):", responseText.substring(0, 300) + "...");

        let questionsArray;
        try {
            const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
            questionsArray = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[Backend] Failed to parse Gemini response as JSON:", parseError.message);
            console.error("[Backend] Raw text received that failed parsing:", responseText);
            return res.status(500).json({ error: "Failed to parse questions from AI. The AI response was not valid JSON.", rawResponse: responseText });
        }

        // Enhanced Validation
        if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
            console.error("[Backend] Parsed response is not a non-empty array:", questionsArray);
            return res.status(500).json({ error: "AI response was not a valid non-empty array of questions.", rawResponse: responseText });
        }
        const firstQuestion = questionsArray[0];
        if (
            !firstQuestion ||
            typeof firstQuestion.text !== 'string' ||
            !Array.isArray(firstQuestion.options) ||
            firstQuestion.options.length !== 3
        ) {
            console.error("[Backend] First question object has incorrect main structure (text or options array is invalid):", firstQuestion);
            return res.status(500).json({ error: "AI returned questions with an incorrect main data structure.", rawResponse: responseText });
        }
        const firstOption = firstQuestion.options[0];
        if (
            !firstOption ||
            typeof firstOption.optionText !== 'string' ||
            typeof firstOption.consequenceText !== 'string' ||
            typeof firstOption.move !== 'number' ||
            ![-2, -1, 0, 1, 2].includes(firstOption.move) // Validate move value range
        ) {
            console.error("[Backend] First option object in the first question has incorrect structure or invalid move value:", firstOption);
            return res.status(500).json({ error: "AI returned options with an incorrect data structure or invalid move value.", rawResponse: responseText });
        }
        
        console.log(`[Backend] Successfully generated and validated basic structure for ${questionsArray.length} ESL questions.`);
        res.json(questionsArray);

    } catch (error) {
        console.error("[Backend] General error in /api/generate-esl-questions:", error);
        if (error.response && error.response.data) {
            console.error('[Backend] Gemini API reported error details:', error.response.data);
            return res.status(500).json({ error: 'Error from AI service.', details: error.response.data });
        }
        res.status(500).json({ error: 'Internal server error while generating ESL questions.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(GEMINI_API_KEY ? "Gemini API Key loaded successfully." : "Gemini API Key NOT FOUND in .env file!");
});