// frontend/src/components/DialogueWindow.jsx
import React, { useState } from 'react';
import './DialogueWindow.css';

const DialogueWindow = () => {
    const [userInput, setUserInput] = useState('');
    const [geminiResponse, setGeminiResponse] = useState(''); // Initialize as empty
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // For production, replace with your deployed backend URL.
    // For local dev with Vite proxy, base URL is effectively empty for '/api' calls.
    const API_BASE_URL = import.meta.env.DEV
        ? '' // Vite proxy will handle /api in development
        : 'YOUR_DEPLOYED_BACKEND_URL_HERE_FOR_PRODUCTION'; // e.g., https://my-gemini-backend.onrender.com

    const handleSubmit = async (e) => {
        e.preventDefault(); // Good practice for forms
        if (!userInput.trim()) {
            setError("Please enter a question before sending.");
            return;
        }

        setIsLoading(true);
        setError('');
        setGeminiResponse(''); // Clear previous response

        try {
            // The '/api/ask-gemini' path will be proxied by Vite in dev
            const response = await fetch(`${API_BASE_URL}/api/ask-gemini`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userPrompt: userInput }),
            });

            const data = await response.json(); // Try to parse JSON response

            if (!response.ok) {
                // Use error message from backend response if available
                throw new Error(data.error || `Server responded with status: ${response.status}`);
            }

            setGeminiResponse(data.reply);
        } catch (err) {
            console.error("[Frontend] Error making API call:", err);
            setError(err.message || "An unexpected error occurred while fetching the response.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dialogue-container-component">
            <h1>Ask Gemini</h1>
            <form onSubmit={handleSubmit} className="dialogue-form">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your question for Gemini..."
                    disabled={isLoading}
                    rows="4"
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send to Gemini'}
                </button>
            </form>

            {isLoading && <p className="status-message">Loading response...</p>}
            {error && <p className="status-message error-message-component">{error}</p>}

            {geminiResponse && !isLoading && !error && ( // Only show if there's a response, not loading, and no error
                <div className="response-area-component">
                    <h2>Gemini's Response:</h2>
                    <p className="response-text-component">{geminiResponse}</p>
                </div>
            )}
        </div>
    );
};

export default DialogueWindow;