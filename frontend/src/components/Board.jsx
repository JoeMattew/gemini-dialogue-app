// frontend/src/components/Board.jsx
import React from 'react';
import Square from './Square';
import CentralQuestionDisplay from './CentralQuestionDisplay'; // Use new component
import './Board.css';

// getSquareStyle function remains the same (36-square, 15x5 grid version)
const getSquareStyle = (squareId, H_GRID_CELLS, V_GRID_CELLS) => {
  let r, c;
  const top_end_id = H_GRID_CELLS;
  const right_side_length = V_GRID_CELLS - 1;
  const right_end_id = top_end_id + right_side_length;
  const bottom_row_length = H_GRID_CELLS - 1;
  const bottom_end_id = right_end_id + bottom_row_length;

  if (squareId >= 1 && squareId <= top_end_id) { r = 1; c = squareId; }
  else if (squareId > top_end_id && squareId <= right_end_id) { r = 1 + (squareId - top_end_id); c = H_GRID_CELLS; }
  else if (squareId > right_end_id && squareId <= bottom_end_id) { r = V_GRID_CELLS; c = H_GRID_CELLS - (squareId - right_end_id); }
  else if (squareId > bottom_end_id && squareId <= 36) { r = V_GRID_CELLS - (squareId - bottom_end_id); c = 1; }
  else { return { border: '2px solid orange' }; }
  return { gridRowStart: r, gridColumnStart: c };
};

const Board = ({
  players,
  config, // { H_GRID_CELLS, V_GRID_CELLS, TOTAL_SQUARES }
  // Props for the question display
  showQuestionInBoard, // boolean: true if gamePhase is 'questioning'
  currentQuestionText,
  activePlayerNameForQuestion,
  onQuestionContinue // function to call when "Continue" on question is clicked
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
    if (i===1) type = 'go'; // 'go' styling takes precedence

    squaresCmp.push(
      <Square key={i} id={i} style={style} type={type}>
        {players.map(p => p.pos === i && (
          <div key={p.id} className="player-token-gfx" style={{ backgroundColor: p.color }} title={p.name}>
            {p.id}
          </div>
        ))}
      </Square>
    );
  }

  return (
    <div className="board-area-container"> {/* This container might not be needed if App.css handles width */}
      <div
        className="board-grid-layout"
        style={{
          '--grid-cols': config.H_GRID_CELLS,
          '--grid-rows': config.V_GRID_CELLS,
          '--square-cell-size': 'auto', // Or a fixed size like '40px'
        }}
      >
        {squaresCmp}
        <div className="board-center-content-area"> {/* Renamed class */}
            <CentralQuestionDisplay
              questionText={showQuestionInBoard ? currentQuestionText : null} // Only pass text if showing question
              playerName={activePlayerNameForQuestion}
              onContinue={onQuestionContinue}
            />
        </div>
      </div>
    </div>
  );
};

export default Board;