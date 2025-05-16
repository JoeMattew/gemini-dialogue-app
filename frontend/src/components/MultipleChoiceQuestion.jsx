// frontend/src/components/MultipleChoiceQuestion.jsx
import React, { useState, useEffect } from 'react';
import './MultipleChoiceQuestion.css'; // Ensure this CSS file exists and is styled

const MultipleChoiceQuestion = ({
  questionObj,
  playerName,
  onAnswerFinalized // Renamed prop for clarity: App.jsx will pass its handler here
}) => {
  const [selectedOption, setSelectedOption] = useState(null); // Stores the entire chosen option object
  const [showConsequencePanel, setShowConsequencePanel] = useState(false);

  // Reset local state when a new question (questionObj) is passed in
  useEffect(() => {
    setSelectedOption(null);
    setShowConsequencePanel(false);
    // console.log("[MCQ] New question, resetting local state. Question:", questionObj?.text);
  }, [questionObj]);

  if (!questionObj || !questionObj.text || !Array.isArray(questionObj.options) || questionObj.options.length === 0) {
    return (
      <div className="mcq-area-game placeholder-mcq">
        <p>Landed on a square! Preparing question...</p>
      </div>
    );
  }

  const handleOptionClick = (option) => {
    if (showConsequencePanel) return; // Don't allow re-selecting if consequence is already shown

    console.log("[MCQ] Option clicked:", option.optionText);
    setSelectedOption(option);
    setShowConsequencePanel(true); // Switch to showing the consequence panel
  };

  const handleProceedAfterConsequence = () => {
    if (selectedOption) {
      console.log("[MCQ] 'OK/Next Turn' clicked. Finalizing answer with option:", selectedOption);
      onAnswerFinalized(selectedOption); // Notify App.jsx that the player has seen consequence and is ready
    } else {
      console.error("[MCQ] 'OK/Next Turn' clicked but no selectedOption was set!");
    }
    // The component will re-render with a new questionObj or be unmounted by App.jsx changing phase
  };

  return (
    <div className="mcq-area-game active-mcq">
      <h4>{playerName}'s Question:</h4>
      <p className="mcq-question-text-game">{questionObj.text}</p>

      {!showConsequencePanel && ( // Show options IF consequence panel is not active
        <div className="mcq-options-game horizontal">
          {questionObj.options.map((opt, index) => (
            <button
              key={index}
              className="mcq-option-button-game"
              onClick={() => handleOptionClick(opt)}
              // Button is implicitly enabled here because showConsequencePanel is false
            >
              {opt.optionText}
            </button>
          ))}
        </div>
      )}

      {showConsequencePanel && selectedOption && ( // Show consequence panel IF an option has been selected
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