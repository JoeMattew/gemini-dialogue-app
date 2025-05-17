// frontend/src/components/Board.jsx
import React from 'react';
import Square from './Square';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import './Board.css';

// getSquareStyle function remains the same
const getSquareStyle = (squareId, H_GRID_CELLS, V_GRID_CELLS) => { /* ... as before ... */
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
  else { console.error(`getSquareStyle: Invalid squareId ${squareId}`); return { border: '2px solid orange' }; }
  return { gridRowStart: r, gridColumnStart: c };
};

const Board = ({
  players,
  config,
  // Props from App.jsx that determine what's shown in the center
  showQuestionArea,          // True if center should show MCQ content (question or consequence)
  currentQuestionObj,        // The question object (if showing question)
  activePlayerNameForQuestion, // Name of player for whom question/consequence is relevant
  onAnswerSelect,
  
  isDisplayingConsequence,   // True if MCQ should be in "show consequence" mode
  consequenceToShow,         // The {consequenceText, move} object
  disableOptions             // True if MCQ option buttons should be disabled
}) => {
  const squaresCmp = [];
  for (let i = 1; i <= config.TOTAL_SQUARES; i++) {
    // ... (square generation logic remains the same) ...
    const style = getSquareStyle(i, config.H_GRID_CELLS, config.V_GRID_CELLS);
    let type = '';
    if (i === 1) type = 'go';
    else if (i === config.H_GRID_CELLS || 
             i === config.H_GRID_CELLS + (config.V_GRID_CELLS - 1) ||
             i === config.H_GRID_CELLS + (config.V_GRID_CELLS - 1) + (config.H_GRID_CELLS -1) ) {
      type = 'corner';
    }
    if (i===1) type = 'go';
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
    <div className="board-area-container">
      <div
        className="board-grid-layout"
        style={{
          '--grid-cols': config.H_GRID_CELLS,
          '--grid-rows': config.V_GRID_CELLS,
        }}
      >
        {squaresCmp}
        <div className="board-center-content-area">
          {showQuestionArea ? (
            <MultipleChoiceQuestion
              questionObj={currentQuestionObj} // Will be null if isDisplayingConsequence is true
              playerName={activePlayerNameForQuestion}
              onAnswerSelect={onAnswerSelect}
              isDisplayingConsequence={isDisplayingConsequence}
              consequenceToShow={consequenceToShow}
              disableOptions={disableOptions}
            />
          ) : (
            <div className="mcq-area-game placeholder-mcq">
                <p>Roll the dice!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;