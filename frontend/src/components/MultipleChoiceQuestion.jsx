// frontend/src/components/MultipleChoiceQuestion.jsx
import React from 'react'; // Removed useState, useEffect as it's simpler now
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({
  questionObj,          // Full question object {text, options} - null if showing only consequence
  playerName,
  onAnswerSelect,       // Callback when an option is clicked
  isDisplayingConsequence, // Boolean: true if App wants to show consequence
  consequenceToShow,     // Object: { consequenceText, move }
  disableOptions         // Boolean: true if options should be disabled
}) => {

  // Mode 1: Displaying ONLY the consequence
  if (isDisplayingConsequence && consequenceToShow) {
    return (
      <div className="mcq-area-game consequence-display-only"> {/* New class for specific styling */}
        {/* No player name or question text repeated here */}
        <p className="mcq-consequence-text-only">{consequenceToShow.consequenceText}</p>
        <p className="mcq-consequence-move-only">
          Action: {consequenceToShow.move > 0 ? `Move +${consequenceToShow.move}` : (consequenceToShow.move < 0 ? `Move ${consequenceToShow.move}` : 'Stay put')}
        </p>
        {/* "Applying action..." text can be controlled by a prop from App.jsx if needed, or removed */}
        {/* <p className="processing-move-text">Applying action...</p> */}
      </div>
    );
  }

  // Mode 2: Displaying the question and options
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
              onClick={() => onAnswerSelect(opt)} // Immediately call back with chosen option
              disabled={disableOptions}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fallback/Placeholder if neither question nor consequence is ready
  return (
    <div className="mcq-area-game placeholder-mcq">
      <p>Loading question or action...</p>
    </div>
  );
};

export default MultipleChoiceQuestion;