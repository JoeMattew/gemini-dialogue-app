// frontend/src/components/CentralQuestionDisplay.jsx
import React from 'react';
import './CentralQuestionDisplay.css';

const CentralQuestionDisplay = ({ questionText, playerName }) => { // Removed onContinue
  if (!questionText) {
    return (
        <div className="central-question-area placeholder">
            <p>Prepare for your turn!</p> {/* Updated placeholder */}
        </div>
    );
  }

  return (
    <div className="central-question-area active-question">
      <h4>{playerName}'s Question:</h4>
      <p className="central-question-text-content">{questionText}</p>
      {/* "Continue" button removed */}
    </div>
  );
};

export default CentralQuestionDisplay;