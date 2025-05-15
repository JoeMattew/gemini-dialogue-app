// frontend/src/components/DiceDisplay.jsx
import React from 'react';
import './DiceDisplay.css';

const DiceDisplay = ({ value }) => {
  const diceFaces = {
    1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅',
  };
  return (
    <div className="dice-display-area">
      {value !== null && typeof value === 'number' ? diceFaces[value] : '🎲'}
    </div>
  );
};

export default DiceDisplay;