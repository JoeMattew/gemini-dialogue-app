import React from 'react';
import DiceDisplay from './DiceDisplay';
import RollButton from './RollButton';
import './GameControls.css';

const GameControls = ({ currentDiceRoll, onRollDice, activePlayerName, isRollDisabled }) => {
  return (
    <div className="game-controls-bottom-panel">
      <DiceDisplay value={currentDiceRoll} />
      <RollButton
        onClick={onRollDice}
        playerName={activePlayerName}
        disabled={isRollDisabled}
      />
    </div>
  );
};
export default GameControls;