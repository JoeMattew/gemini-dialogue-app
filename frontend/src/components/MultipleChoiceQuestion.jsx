// frontend/src/components/MultipleChoiceQuestion.jsx
import React, { useState, useEffect } from 'react';
import './MultipleChoiceQuestion.css';

// isShowingConsequence prop will be controlled by App.jsx
// chosenOptionForConsequence prop will be the option object if consequence should be shown
const MultipleChoiceQuestion = ({
  questionObj,
  playerName,
  onAnswerSelect, // Called when an option button is clicked
  isButtonsDisabled, // To disable option buttons after selection
  isShowingConsequence,
  chosenOptionForConsequence
}) => {

  if (!questionObj || !questionObj.text || !questionObj.options) {
    return (
      <div className="mcq-area-game placeholder-mcq">
        <p>Player landed on a square!</p>
      </div>
    );
  }

  const handleOptionClick = (option) => {
    if (isButtonsDisabled) return;
    onAnswerSelect(option); // Notify App.jsx immediately
  };

  return (
    <div className="mcq-area-game active-mcq">
      <h4>{playerName}'s Question:</h4>
      <p className="mcq-question-text-game">{questionObj.text}</p>

      {!isShowingConsequence && ( // Show options if not showing consequence
        <div className="mcq-options-game horizontal">
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button-game"
              onClick={() => handleOptionClick(opt)}
              disabled={isButtonsDisabled}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      )}

      {isShowingConsequence && chosenOptionForConsequence && (
        <div className="mcq-consequence-game">
          <p className="mcq-chosen-option-text">You chose: "{chosenOptionForConsequence.optionText}"</p>
          <p className="mcq-consequence-text-game">{chosenOptionForConsequence.consequenceText}</p>
          <p className="mcq-consequence-move-game">
            Action: {chosenOptionForConsequence.move > 0 ? `Move +${chosenOptionForConsequence.move}` : (chosenOptionForConsequence.move < 0 ? `Move ${chosenOptionForConsequence.move}` : 'Stay put')}
          </p>
          {/* No button here; App.jsx will auto-advance after a delay */}
          <p className="processing-move-text">Applying consequence...</p>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;