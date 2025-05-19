// frontend/src/components/Board.jsx
import React from 'react';
import Square from './Square';
import MultipleChoiceQuestion from './MultipleChoiceQuestion'; // Assuming this is your MCQ component
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
  else { console.error(`getSquareStyle: Invalid squareId ${squareId}`); return { border: '2px solid orange' }; }
  return { gridRowStart: r, gridColumnStart: c };
};

const Board = ({
  players,
  config,
  boardCenterContent,
  onAnswerSelect,
  disableOptions,
  activePlayerId,     // Current active player's ID
  gamePhaseForGlow    // Current gamePhase
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
    if (i===1) type = 'go';

    squaresCmp.push(
      <Square key={i} id={i} style={style} type={type}>
        {players.map(p => {
          // Determine if THIS player's token (p.id) should glow
          const isThisPlayerTokenActive = p.id === activePlayerId &&
            (gamePhaseForGlow === 'rolling' ||
             gamePhaseForGlow === 'diceMoving' ||
             gamePhaseForGlow === 'questioning' ||
             gamePhaseForGlow === 'consequenceMoving' ||
             gamePhaseForGlow === 'showingConsequence'); // Glow during these active phases for the player

          return p.pos === i && ( // If player p is on this square i
            <div
              key={p.id}
              className={`player-token-gfx ${isThisPlayerTokenActive ? 'glowing' : ''}`}
              style={{ 
                backgroundColor: p.color,
                // Set CSS variable for token glow color, used by the .glowing animation
                ...(isThisPlayerTokenActive && { '--token-glow-color': p.color }) 
              }}
              title={p.name}
            >
              {p.id}
            </div>
          );
        })}
      </Square>
    );
  }

  // --- Logic for what to display in the center of the board ---
  let displayInCenter;
  if (boardCenterContent) {
    const { type, content, playerName } = boardCenterContent;
    if (type === 'question' && content) {
      displayInCenter = (
        <MultipleChoiceQuestion
          questionObj={content}
          playerName={playerName}
          onAnswerSelect={onAnswerSelect}
          disableOptions={disableOptions} // Pass this down
          isDisplayingConsequence={false}
          consequenceToShow={null}
        />
      );
    } else if (type === 'consequence' && content) {
      displayInCenter = (
        <MultipleChoiceQuestion
          questionObj={null}
          playerName={playerName}
          onAnswerSelect={() => {}} // No action needed from MCQ when just displaying consequence
          isDisplayingConsequence={true}
          consequenceToShow={content}
          disableOptions={true} // Options are irrelevant when showing consequence
        />
      );
    } else if (type === 'placeholder') {
        displayInCenter = (
            <div className="mcq-area-game placeholder-mcq">
                <p>{content || "Roll the dice!"}</p>
            </div>
        );
    } else { 
        displayInCenter = (
            <div className="mcq-area-game placeholder-mcq">
                <p>Next action...</p>
            </div>
        );
    }
  } else { 
    displayInCenter = (
        <div className="mcq-area-game placeholder-mcq">
            <p>Roll the dice!</p>
        </div>
    );
  }
  // --- End logic for board center display ---

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
          {displayInCenter}
        </div>
      </div>
    </div>
  );
};

export default Board;