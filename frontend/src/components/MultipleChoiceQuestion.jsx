// frontend/src/components/MultipleChoiceQuestion.jsx
import React from 'react';
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({
  questionObj,          // { text: "...", options: [{optionText, consequenceText, move}, ...] }
  playerName,
  onAnswerSelect,       // Callback when an option is clicked, passes the chosen option object
  isDisplayingConsequence, // Boolean: true if App wants to show consequence
  consequenceToShow,     // Object: { consequenceText, move }
  disableOptions         // Boolean: true if options should be disabled (e.g., after selection)
}) => {

  if (isDisplayingConsequence && consequenceToShow) {
    return (
      <div className="mcq-area-game consequence-display-active">
        {/* <h4>Outcome for {playerName}:</h4> Removing player name here to simplify */}
        <p className="mcq-consequence-text-game">{consequenceToShow.consequenceText}</p>
        <p className="mcq-consequence-move-game">
          Action: {consequenceToShow.move > 0 ? `Move +${consequenceToShow.move}` : (consequenceToShow.move < 0 ? `Move ${consequenceToShow.move}` : 'Stay put')}
        </p>
        <p className="processing-move-text">Applying action...</p>
      </div>
    );
  }

  if (!questionObj || !questionObj.text || !Array.isArray(questionObj.options)) {
    return (
      <div className="mcq-area-game placeholder-mcq">
        {/* This placeholder is shown by Board.jsx if showQuestionInBoard is false */}
        {/* So, if we reach here, it means questionObj is missing/malformed */}
        <p>Loading question...</p>
      </div>
    );
  }

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
};

export default MultipleChoiceQuestion;