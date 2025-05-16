// frontend/src/components/MultipleChoiceQuestion.jsx
import React, { useState, useEffect } from 'react';
import './MultipleChoiceQuestion.css';

const CONSEQUENCE_DISPLAY_DURATION_MCQ = 4000; // Duration to show consequence within MCQ

const MultipleChoiceQuestion = ({ 
    questionObj, 
    playerName, 
    onAnswerSelect, // This is now handleAnswerConsequenceProcessed from App.jsx
    isProcessingAnswer // This prop is now more like "isAnswerFinalizedByApp"
                       // Let's rename for clarity if App controls this state: disableOptions
}) => {
  const [selectedOption, setSelectedOption] = useState(null); // Option object: {optionText, consequenceText, move}
  const [showConsequencePanel, setShowConsequencePanel] = useState(false);

  useEffect(() => {
    // Reset when a new question comes in
    setSelectedOption(null);
    setShowConsequencePanel(false);
  }, [questionObj]);

  if (!questionObj || !questionObj.text || !questionObj.options) {
    return (
      <div className="mcq-area-game placeholder-mcq">
        <p>Landed on a square!</p>
      </div>
    );
  }

  const handleOptionClick = (option) => {
    if (showConsequencePanel) return; // Don't allow re-selecting if consequence is shown

    setSelectedOption(option);
    setShowConsequencePanel(true);
    // No immediate call to onAnswerSelect here; user will click "OK/Next Turn"
  };

  const handleProceedAfterConsequence = () => {
    if (selectedOption) {
      onAnswerSelect(selectedOption); // Now notify App.jsx with the chosen option
    }
    // State will be reset by useEffect when questionObj changes via App.jsx
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