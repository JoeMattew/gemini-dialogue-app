// frontend/src/components/MultipleChoiceQuestion.jsx
import React, { useState } from 'react';
import './MultipleChoiceQuestion.css'; // Create this CSS file

const MultipleChoiceQuestion = ({ questionObj, playerName, onAnswerSelect }) => {
  const [selectedOption, setSelectedOption] = useState(null); // To store the chosen option object
  const [showConsequence, setShowConsequence] = useState(false);

  if (!questionObj || !questionObj.text || !questionObj.options) {
    return (
      <div className="mcq-area placeholder">
        <p>Loading question or turn transition...</p>
      </div>
    );
  }

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowConsequence(true);
    // Call onAnswerSelect after a short delay to show consequence, or immediately and App.jsx handles showing consequence
    // For now, let's show consequence here, then App.jsx will handle movement and turn change.
    // A "Next Turn" button will appear after showing consequence.
  };

  const handleProceed = () => {
    onAnswerSelect(selectedOption); // Pass the whole selected option object
    setSelectedOption(null);      // Reset for next question
    setShowConsequence(false);
  };

  return (
    <div className="mcq-area active-question">
      <h4>{playerName}'s Scenario:</h4>
      <p className="mcq-question-text">{questionObj.text}</p>

      {!showConsequence && (
        <div className="mcq-options">
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button"
              onClick={() => handleOptionClick(opt)}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      )}

      {showConsequence && selectedOption && (
        <div className="mcq-consequence">
          <p className="mcq-consequence-text">{selectedOption.consequenceText}</p>
          <p className="mcq-consequence-move">
            Movement: {selectedOption.move > 0 ? `+${selectedOption.move}` : selectedOption.move} step(s)
          </p>
          <button onClick={handleProceed} className="mcq-proceed-button">
            OK / Next Turn
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;