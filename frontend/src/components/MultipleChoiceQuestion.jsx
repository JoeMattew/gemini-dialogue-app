// frontend/src/components/MultipleChoiceQuestion.jsx
// THIS IS THE VERSION THAT MANAGES ITS OWN CONSEQUENCE DISPLAY INTERNALLY
import React, { useState, useEffect } from 'react';
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({
  questionObj,
  playerName,
  onAnswerFinalized // App.jsx will pass its handleAnswerSelect as this prop
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showConsequencePanel, setShowConsequencePanel] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setShowConsequencePanel(false);
  }, [questionObj]);

  if (!questionObj || !questionObj.text || !Array.isArray(questionObj.options)) {
    return (
      <div className="mcq-area-game placeholder-mcq">
        <p>Player landed on a square!</p>
      </div>
    );
  }

  const handleOptionClick = (option) => {
    if (showConsequencePanel) return;
    setSelectedOption(option);
    setShowConsequencePanel(true);
  };

  const handleProceedAfterConsequence = () => {
    if (selectedOption) {
      onAnswerFinalized(selectedOption); // This calls App.jsx's function
    }
  };

  return (
    <div className="mcq-area-game active-mcq">
      <h4>{playerName}'s Question:</h4>
      <p className="mcq-question-text-game">{questionObj.text}</p>

      {!showConsequencePanel && (
        <div className="mcq-options-game horizontal">
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button-game"
              onClick={() => handleOptionClick(opt)}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      )}

      {showConsequencePanel && selectedOption && (
        <div className="mcq-consequence-game">
          <p className="mcq-chosen-option-text">You chose: "{selectedOption.optionText}"</p>
          <p className="mcq-consequence-text-game">{selectedOption.consequenceText}</p>
          <p className="mcq-consequence-move-game">
            Action: {selectedOption.move > 0 ? `Move +${selectedOption.move}` : (selectedOption.move < 0 ? `Move ${selectedOption.move}` : 'Stay put')}
          </p>
          <button onClick={handleProceedAfterConsequence} className="mcq-proceed-button">
            OK / Next Turn
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;