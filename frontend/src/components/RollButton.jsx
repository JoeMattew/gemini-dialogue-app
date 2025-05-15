// frontend/src/components/RollButton.jsx
import React from 'react';
import './RollButton.css';

const RollButton = ({ onClick, playerName, disabled }) => {
  return (
    <button
      className="game-roll-button"
      onClick={onClick}
      disabled={disabled}
    >
      {disabled ? 'Waiting...' : `${playerName}, Roll Dice!`}
    </button>
  );
};

export default RollButton;