// frontend/src/components/Board.jsx
import React from 'react';
import Square from './Square';
import DiceDisplay from './DiceDisplay'; // We'll create this
import RollButton from './RollButton';   // We'll create this
import './Board.css';

// H_GRID_CELLS and V_GRID_CELLS are the dimensions of the CSS Grid
// totalSquares is the number of playable squares (e.g., 36)
const getSquareStyle = (squareId, H_GRID_CELLS, V_GRID_CELLS) => {
  // Using the 36-square, 15x5 grid logic from our previous successful version
  let r, c;
  const top_end_id = H_GRID_CELLS; // 15
  const right_side_length = V_GRID_CELLS - 1; // 5-1 = 4
  const right_end_id = top_end_id + right_side_length; // 15 + 4 = 19
  const bottom_row_length = H_GRID_CELLS - 1; // 15-1 = 14
  const bottom_end_id = right_end_id + bottom_row_length; // 19 + 14 = 33
  // Left side is 36 - 33 = 3 squares (34, 35, 36)

  if (squareId >= 1 && squareId <= top_end_id) { // Top Row (1 to 15)
    r = 1; c = squareId;
  } else if (squareId > top_end_id && squareId <= right_end_id) { // Right Side (16 to 19)
    r = 1 + (squareId - top_end_id); c = H_GRID_CELLS;
  } else if (squareId > right_end_id && squareId <= bottom_end_id) { // Bottom Row (20 to 33)
    r = V_GRID_CELLS; c = H_GRID_CELLS - (squareId - right_end_id);
  } else if (squareId > bottom_end_id && squareId <= 36) { // Left Side (34 to 36)
    r = V_GRID_CELLS - (squareId - bottom_end_id); c = 1;
  } else {
    console.error(`getSquareStyle: Invalid squareId ${squareId}`);
    return { border: '2px solid orange' }; // Fallback for errors
  }
  return { gridRowStart: r, gridColumnStart: c };
};

const Board = ({
  players, // Array of player objects [{ id, pos, color, name }, ...]
  onRollDice, // Function to call when roll button is clicked
  currentDiceRoll, // Value of the current dice roll { player1: val, player2: val } or just for current player
  activePlayerId, // ID of the player whose turn it is
  isRollDisabled, // Boolean to disable roll button
  config // Board configuration { H_GRID_CELLS, V_GRID_CELLS, TOTAL_SQUARES }
}) => {
  const squaresCmp = [];
  for (let i = 1; i <= config.TOTAL_SQUARES; i++) {
    const style = getSquareStyle(i, config.H_GRID_CELLS, config.V_GRID_CELLS);
    let type = '';
    if (i === 1) type = 'go';
    else if (i === config.H_GRID_CELLS || 
             i === config.H_GRID_CELLS + (config.V_GRID_CELLS - 1) ||
             i === config.H_GRID_CELLS + (config.V_GRID_CELLS - 1) + (config.H_GRID_CELLS -1) ) {
      type = 'corner';
    }
    if (i===1) type = 'go'; // Go overrides corner


    squaresCmp.push(
      <Square key={i} id={i} style={style} type={type}>
        {players.map(p => p.pos === i && (
          <div key={p.id} className="player-token-gfx" style={{ backgroundColor: p.color }} title={p.name}>
            {p.id} {/* Show player ID on token */}
          </div>
        ))}
      </Square>
    );
  }

  const activePlayerName = players.find(p => p.id === activePlayerId)?.name || '';

  return (
    <div className="board-area-container">
      <div
        className="board-grid-layout"
        style={{
          '--grid-cols': config.H_GRID_CELLS,
          '--grid-rows': config.V_GRID_CELLS,
        }}
      >
        {squaresCmp}
        <div className="board-center-controls">
          <DiceDisplay value={currentDiceRoll} /> {/* Will show current player's roll */}
          <RollButton
            onClick={onRollDice}
            playerName={activePlayerName}
            disabled={isRollDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default Board;