// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import './App.css'; // Create this for App-specific layout styles

// Board Configuration (36 squares, 15x5 grid)
const BOARD_CONFIG = {
  H_GRID_CELLS: 15,
  V_GRID_CELLS: 5,
  TOTAL_SQUARES: 36,
};

const initialPlayers = [
  { id: 1, name: 'Player 1', color: 'var(--player-1-color, blue)', pos: 1, currentDice: null },
  { id: 2, name: 'Player 2', color: 'var(--player-2-color, red)', pos: 1, currentDice: null },
];

function App() {
  const [players, setPlayers] = useState(initialPlayers);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentOverallDiceRoll, setCurrentOverallDiceRoll] = useState(null); // For DiceDisplay
  const [gamePhase, setGamePhase] = useState('rolling'); // 'rolling', 'moving', 'questioning', 'setup'

  // In a real game, dice roll would be part of player's turn logic
  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    setGamePhase('moving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentOverallDiceRoll(rollValue);

    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === activePlayerId ? { ...p, currentDice: rollValue } : p
      )
    );

    // Simulate movement delay then update position
    setTimeout(() => {
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + rollValue;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = (newPos % BOARD_CONFIG.TOTAL_SQUARES) || BOARD_CONFIG.TOTAL_SQUARES; // Wrap around, ensure not 0
            }
            return { ...p, pos: newPos };
          }
          return p;
        })
      );
      // Switch to next player and next phase (which will be 'questioning' later)
      setActivePlayerId(prevId => (prevId === 1 ? 2 : 1));
      setGamePhase('rolling'); // For now, go back to rolling for next player
      setCurrentOverallDiceRoll(null); // Clear dice for next turn visual
    }, 700); // Delay for "movement"
  }, [activePlayerId, gamePhase]);


  return (
    <div className="esl-game-app-container">
      <header className="game-header-title">
        <h1>ESL Adventure Board Game</h1>
      </header>

      <div className="players-panel">
        {players.map(player => (
          <Player
            key={player.id}
            name={player.name}
            color={player.color}
            diceValue={player.currentDice}
            isActive={player.id === activePlayerId && gamePhase !== 'moving'}
            currentSquare={player.pos}
          />
        ))}
      </div>

      <Board
        players={players}
        onRollDice={handleRollDice}
        currentDiceRoll={currentOverallDiceRoll}
        activePlayerId={activePlayerId}
        isRollDisabled={gamePhase !== 'rolling'}
        config={BOARD_CONFIG}
      />

      {/* Debug Info (Optional) */}
      {/* <div className="debug-info">
        <p>Active Player: {activePlayerId}</p>
        <p>Game Phase: {gamePhase}</p>
        <p>Player 1 Pos: {players.find(p=>p.id===1)?.pos} | Player 2 Pos: {players.find(p=>p.id===2)?.pos}</p>
      </div> */}
    </div>
  );
}

export default App;