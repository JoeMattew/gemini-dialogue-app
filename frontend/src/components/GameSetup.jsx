// frontend/src/components/GameSetup.jsx
import React, { useState } from 'react';
import './GameSetup.css'; // Make sure this CSS file exists and is styled

const GameSetup = ({ onQuestionsAndSettingsReady }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('A1 - Beginner');
  const [structure, setStructure] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.DEV
      ? '' // Vite proxy for local dev
      : 'https://gemini-dialogue-backend.onrender.com'; // YOUR DEPLOYED RENDER URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || !level || !structure) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    const requestPayload = {
        topic,
        level,
        structure,
        count: 40, // Requesting 40 questions
        questionType: 'open_ended'
    };

    try {
      console.log('[GameSetup] Sending request to backend:', requestPayload);
      const response = await fetch(`${API_BASE_URL}/api/generate-esl-questions`, { // Ensure this endpoint exists on your backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Server error: ${response.status}`);
      }

      if (!Array.isArray(responseData) || (responseData.length > 0 && typeof responseData[0].text === 'undefined')) {
        console.error("[GameSetup] Invalid question format received:", responseData);
        throw new Error("Received invalid question format from server. Expected array of objects with 'text'.");
      }

      console.log('[GameSetup] Successfully received questions:', responseData);
      onQuestionsAndSettingsReady(responseData, { topic, level, structure }); // Pass data to App.jsx

    } catch (err) {
      console.error("[GameSetup] Error fetching ESL questions:", err);
      setError(err.message || 'An unexpected error occurred fetching questions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="game-setup-overlay">
      <div className="game-setup-modal">
        <h2>ESL Board Game Setup</h2>
        <p>Configure the questions for your game:</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">Topic:</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Food, Transport, Daily Routines"
              disabled={isLoading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="level">Student Level:</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} disabled={isLoading}>
              <option value="A1 - Beginner">A1 - Beginner</option>
              <option value="A2 - Elementary">A2 - Elementary</option>
              <option value="B1 - Pre-Intermediate">B1 - Pre-Intermediate</option>
              <option value="B2 - Intermediate">B2 - Intermediate</option>
              <option value="C1 - Upper-Intermediate">C1 - Upper-Intermediate</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="structure">Grammar/Structure Focus:</label>
            <input
              type="text"
              id="structure"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="e.g., Present Simple, 'What do you like? + 🍎'"
              disabled={isLoading}
              required
            />
            <small>Example: "Forming questions with 'do/does'", "Using 'like' + gerund"</small>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-buttons">
            <button type="submit" disabled={isLoading} className="start-button">
              {isLoading ? 'Generating Questions...' : 'Get Questions & Start Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;