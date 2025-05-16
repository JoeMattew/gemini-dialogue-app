// frontend/src/components/QuestionModal.jsx
import React from 'react';
import './QuestionModal.css'; // We'll create this CSS file

const QuestionModal = ({ questionText, playerName, onAnswer }) => {
  if (!questionText) return null; // Don't render if no question

  return (
    <div className="question-modal-overlay-game">
      <div className="question-modal-content-game">
        <h3>{playerName}'s Question:</h3>
        <p className="question-text-game">{questionText}</p>
        <div className="answer-buttons-game">
          {/* These buttons are for the teacher/other player to judge the verbal answer */}
          <button onClick={() => onAnswer(true)} className="correct-btn-game">
            Correct
          </button>
          <button onClick={() => onAnswer(false)} className="incorrect-btn-game">
            Incorrect
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;