// frontend/src/components/MultipleChoiceQuestion.jsx
import React from 'react';
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({
  questionObj,
  playerName,
  onAnswerSelect,
  isDisplayingConsequence,
  consequenceToShow,
  disableOptions
}) => {

  if (isDisplayingConsequence && consequenceToShow) {
    return (
      <div className="mcq-area-game consequence-display-only">
        <p className="mcq-consequence-text-only">{consequenceToShow.consequenceText}</p>
        <p className="mcq-consequence-move-only">
          Action: {consequenceToShow.move > 0 ? `Move +${consequenceToShow.move}` : (consequenceToShow.move < 0 ? `Move ${consequenceToShow.move}` : 'Stay put')}
        </p>
        {/* Optional: "Applying action..." can be shown if App.jsx gamePhase is consequenceMoving */}
        {/* For now, keeping it simple as App.jsx handles overall phase text implicitly */}
      </div>
    );
  }

  if (questionObj && questionObj.text && Array.isArray(questionObj.options)) {
    return (
      <div className="mcq-area-game active-mcq">
        <h4>{playerName}'s Question:</h4>
        <p className="mcq-question-text-game">{questionObj.text}</p>
        <div className="mcq-options-game horizontal">
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button-game"
              onClick={() => onAnswerSelect(opt)}
              disabled={disableOptions}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for safety, though Board.jsx should handle the main placeholder
  return (
    <div className="mcq-area-game placeholder-mcq">
      <p>Loading...</p>
    </div>
  );
};

export default MultipleChoiceQuestion;