import React, { useState, useEffect } from 'react';
import './MultipleChoiceQuestion.css';

const MultipleChoiceQuestion = ({ questionObj, playerName, onAnswerSelect, isProcessingAnswer }) => {
  // isProcessingAnswer (new prop) can be used to disable buttons after selection
  const [selectedOptionConsequence, setSelectedOptionConsequence] = useState(null);

  // Reset local state when questionObj changes (new question for new player)
  useEffect(() => {
    setSelectedOptionConsequence(null);
  }, [questionObj]);


  if (!questionObj || !questionObj.text || !questionObj.options) {
    return (
      <div className="mcq-area-game placeholder-mcq"> {/* Added specific class */}
        <p>Landed on a square!</p> {/* Placeholder while question loads or if none */}
      </div>
    );
  }

  const handleOptionClick = (option) => {
    if (isProcessingAnswer) return; // Prevent re-clicks while processing
    setSelectedOptionConsequence(option); // Show consequence
    onAnswerSelect(option); // Immediately notify App.jsx of the selection
  };

  return (
    <div className="mcq-area-game active-mcq"> {/* Added specific class */}
      <h4>{playerName}'s Question:</h4>
      <p className="mcq-question-text-game">{questionObj.text}</p>

      {!selectedOptionConsequence && ( // Show options only if no consequence is being displayed
        <div className="mcq-options-game horizontal"> {/* Added 'horizontal' class */}
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button-game"
              onClick={() => handleOptionClick(opt)}
              disabled={isProcessingAnswer}
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      )}

      {selectedOptionConsequence && (
        <div className="mcq-consequence-game">
          <p className="mcq-chosen-option-text">You chose: "{selectedOptionConsequence.optionText}"</p>
          <p className="mcq-consequence-text-game">{selectedOptionConsequence.consequenceText}</p>
          <p className="mcq-consequence-move-game">
            Movement: {selectedOptionConsequence.move > 0 ? `+${selectedOptionConsequence.move}` : selectedOptionConsequence.move} step(s)
          </p>
          {/* The game will auto-advance after this is shown for a bit by App.jsx */}
          {isProcessingAnswer && <p className="processing-move-text">Moving...</p>}
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuestion;