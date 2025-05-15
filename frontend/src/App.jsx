// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup'; // Import GameSetup
// import QuestionModal from './components/QuestionModal'; // We'll add this in the next phase
import './App.css';

const BOARD_CONFIG = {
  H_GRID_CELLS: 15,
  V_GRID_CELLS: 5,
  TOTAL_SQUARES: 36,
};

const initialPlayersData = [ // Renamed to avoid conflict with 'players' state
  { id: 1, name: 'Player 1', color: 'var(--player-1-color, blue)', pos: 1, currentDice: null },
  { id: 2, name: 'Player 2', color: 'var(--player-2-color, red)', pos: 1, currentDice: null },
];

function App() {
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'questioning', 'rolling', 'moving', 'gameOver'
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1); // Player whose turn it is
  const [currentOverallDiceRoll, setCurrentOverallDiceRoll] = useState(null);

  const [eslQuestions, setEslQuestions] = useState([]); // To store questions from Gemini
  const [gameSettings, setGameSettings] = useState(null); // To store topic, level, structure
  // const [currentEslQuestion, setCurrentEslQuestion] = useState(null); // For QuestionModal later

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    console.log("[App.jsx] Questions and settings received:", { fetchedQuestions, settings });
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData); // Reset player positions when new game starts
    setActivePlayerId(1);         // Reset active player
    setCurrentOverallDiceRoll(null);
    setGamePhase('rolling'); // Or 'questioning' once QuestionModal is ready
                             // For now, let's go directly to rolling after setup
  };

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

    setTimeout(() => {
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + rollValue;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = (newPos % BOARD_CONFIG.TOTAL_SQUARES) || BOARD_CONFIG.TOTAL_SQUARES;
            }
            // Check for win condition (optional for now)
            // if (newPos === BOARD_CONFIG.TOTAL_SQUARES) {
            //   setGamePhase('gameOver');
            //   alert(`Player ${p.name} wins!`);
            // }
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // If game is not over, switch player and phase
      // if (gamePhase !== 'gameOver') { // Check if gamePhase changed due to win
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentOverallDiceRoll(null);
        setGamePhase('rolling'); // Next phase will be 'questioning'
      // }
    }, 700);
  }, [activePlayerId, gamePhase]); // Include gamePhase dependency

  // Show setup modal if in 'setup' phase
  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  // Placeholder for Question Modal (to be added next)
  // if (gamePhase === 'questioning' && currentEslQuestion) {
  //   return (
  //     <>
  //       {/* Render board game dimly in background? Or just the modal */}
  //       <QuestionModal question={currentEslQuestion} ... />
  //     </>
  //   );
  // }

  // Render the main game board area
  return (
    <div className="esl-game-app-container">
      <header className="game-header-title">
        <h1>ESL Adventure Board Game</h1>
        {gameSettings && (
          <p className="game-settings-display">
            Topic: {gameSettings.topic} | Level: {gameSettings.level} | Focus: {gameSettings.structure}
          </p>
        )}
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
      
      {/* {eslQuestions.length > 0 && ( // Simple display of question count
        <div style={{marginTop: '20px', fontSize: '0.9em'}}>
            ({eslQuestions.length} questions loaded)
        </div>
      )} */}
    </div>
  );
}

export default App;