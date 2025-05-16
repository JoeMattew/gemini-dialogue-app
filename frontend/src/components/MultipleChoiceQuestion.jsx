// frontend/src/components/MultipleChoiceQuestion.jsx
import React from 'react'; // Removed useState, useEffect as App.jsx controls display
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({
  questionObj,          // Full question object {text, options} - null if showing consequence
  playerName,
  onAnswerSelect,       // Callback when an option is clicked
  isDisplayingConsequence, // Boolean: true if App wants to show consequence
  consequenceToShow,     // Object: { consequenceText, move }
  disableOptions         // Boolean: true if options should be disabled (e.g., after selection/showing consequence)
}) => {

  // Scenario 1: Displaying the consequence
  if (isDisplayingConsequence && consequenceToShow) {
    return (
      <div className="mcq-area-game consequence-display-active">
        <p className="mcq-consequence-text-game">{consequenceToShow.consequenceText}</p>
        <p className="mcq-consequence-move-game">
          Action: {consequenceToShow.move > 0 ? `Move +${consequenceToShow.move}` : (consequenceToShow.move < 0 ? `Move ${consequenceToShow.move}` : 'Stay put')}
        </p>
        <p className="processing-move-text">Applying action...</p>
      </div>
    );
  }

  // Scenario 2: Displaying the question and options
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

  // Scenario 3: Placeholder (e.g., between phases, or if data is missing)
  // This placeholder is now primarily controlled by Board.jsx's logic
  // if showQuestionArea is false. So this might not be hit often if App.jsx manages props well.
  return (
    <div className="mcq-area-game placeholder-mcq">
      <p>Loading...</p>
    </div>
  );
};

export default MultipleChoiceQuestion;