// frontend/src/components/GameSetup.jsx
import React, { useState } from 'react';
import './GameSetup.css';

const GameSetup = ({ onQuestionsAndSettingsReady }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('A1 - Beginner');
  const [structure, setStructure] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Display error message to the user

  const API_BASE_URL = import.meta.env.DEV
      ? '' // Vite proxy for local dev
      : 'https://gemini-dialogue-backend.onrender.com'; // <<< YOUR DEPLOYED RENDER URL - DOUBLE CHECK THIS AGAIN!

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || !level || !structure) {
      const msg = 'Please fill in all fields.';
      setError(msg);
      console.error("[GameSetup] Setup validation failed:", msg); // Add log
      return;
    }
    setError('');
    setIsLoading(true);
    console.log("[GameSetup] Starting question generation..."); // Add log

    const requestPayload = {
        topic,
        level,
        structure,
        count: 40,
        questionType: 'open_ended'
    };

    try {
      console.log('[GameSetup] Sending request to backend:', requestPayload);
      // alert(`[GameSetup] Attempting fetch to: ${API_BASE_URL}/api/generate-esl-questions`); // Aggressive alert for fetch start

      const response = await fetch(`${API_BASE_URL}/api/generate-esl-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      console.log('[GameSetup] Fetch response received. Status:', response.status, 'OK:', response.ok); // Log response status
      // alert(`[GameSetup] Fetch response status: ${response.status}, OK: ${response.ok}`); // Aggressive alert for response

      // Always attempt to parse JSON for more detailed error messages from backend
      let responseData;
      try {
          responseData = await response.json();
          console.log('[GameSetup] Response JSON parsed successfully.'); // Log JSON success
      } catch (jsonError) {
          console.error('[GameSetup] Failed to parse response JSON:', jsonError); // Log JSON parse failure
          setError(`Failed to process server response. Details: ${jsonError.message}`); // Show JSON parse error to user
          setIsLoading(false); // Stop loading
          return; // Stop processing
      }


      if (!response.ok) {
        // Server returned an error status (400, 500, etc.)
        const errorMessage = responseData.error || responseData.message || `Server responded with status ${response.status}`;
        console.error("[GameSetup] Server returned an error status:", errorMessage, "Response Data:", responseData); // Log server error details
        // alert(`[GameSetup] Server error: ${errorMessage}`); // Aggressive alert for server error
        setError(`Error from server: ${errorMessage}`); // Show server error message to user
        setIsLoading(false);
        return; // Stop processing
      }

      // Check if the response data is in the expected format (array of objects with 'text')
      if (!Array.isArray(responseData) || (responseData.length > 0 && typeof responseData[0].text === 'undefined')) {
        const validationErrorMsg = "Received invalid question format from server.";
        console.error("[GameSetup] Data validation failed:", validationErrorMsg, "Received Data:", responseData); // Log validation error
        // alert(`[GameSetup] Data validation failed: ${validationErrorMsg}`); // Aggressive alert
        setError(`${validationErrorMsg} Please check backend logs.`); // Show validation error to user
        setIsLoading(false);
        return; // Stop processing
      }

      console.log(`[GameSetup] Successfully received and validated ${responseData.length} questions.`);
      // alert(`[GameSetup] Success! Received ${responseData.length} questions. Transitioning game.`); // Aggressive alert for success
      onQuestionsAndSettingsReady(responseData, { topic, level, structure }); // Call App's handler to proceed

    } catch (err) {
      // Catch any errors from fetch itself or subsequent synchronous code before JSON parse
      console.error("[GameSetup] Error during fetch process:", err);
      // alert(`[GameSetup] Fetch process error: ${err.message}`); // Aggressive alert for fetch error
      setError(`Network or request error: ${err.message || 'Unknown error'}`); // Show network error to user
    } finally {
      // setIsLoading(false); // Keep loading TRUE until a definite success or a handled error that stops execution
      // This finally block should only reset isLoading if the error wasn't a return.
      // It's safer to set isLoading=false in each error path or right before onQuestionsAndSettingsReady
    }
  };
   // Ensure isLoading is set to false when *any* error path is taken
   // And when onQuestionsAndSettingsReady is called (as the modal disappears anyway)


  return (
    <div className="game-setup-overlay">
      <div className="game-setup-modal">
        <h2>ESL Board Game Setup</h2>
        <p>Configure the questions for your game:</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">Topic:</label>
            <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="..." disabled={isLoading} required/>
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
            <input type="text" id="structure" value={structure} onChange={(e) => setStructure(e.target.value)} placeholder="..." disabled={isLoading} required/>
            <small>Example: "Forming questions with 'do/does'", "Using 'like' + gerund"</small>
          </div>

          {/* Display error message to the user */}
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