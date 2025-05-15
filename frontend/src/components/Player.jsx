// frontend/src/components/Player.jsx
import React from 'react';
import './Player.css';

const Player = ({ name, color, diceValue, isActive, currentSquare }) => {
  return (
    <div className={`player-info ${isActive ? 'active' : ''}`} style={{ borderColor: isActive ? color : 'var(--border-color-light)' }}>
      <h2>{name}</h2>
      <p className="player-score">Dice: {diceValue !== null ? diceValue : '?'}</p>
      <p className="player-position">Position: Square {currentSquare}</p>
    </div>
  );
};

export default Player;