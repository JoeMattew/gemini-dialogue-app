// frontend/src/components/CentralQuestionDisplay.jsx
import React from 'react';
import './CentralQuestionDisplay.css';

const CentralQuestionDisplay = ({ questionText, playerName, onContinue }) => {
  if (!questionText) {
    // This area can show a placeholder when no question is active
    return (
        <div className="central-question-area placeholder">
            <p>Waiting for next turn...</p>
        </div>
    );
  }

  return (
    <div className="central-question-area active-question">
      <h4>{playerName}'s Question:</h4>
      <p className="central-question-text-content">{questionText}</p>
      <button onClick={onContinue} className="continue-button">
        Continue
      </button>
    </div>
  );
};

export default CentralQuestionDisplay;