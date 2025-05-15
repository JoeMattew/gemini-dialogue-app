// frontend/src/App.jsx
import React, { useState, useCallback } from 'react'; // Removed useEffect as it's not strictly needed for this phase

// Import Components
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
// import QuestionModal from './components/QuestionModal'; // Will be added in the next major step

// Import Styles
import './App.css'; // For overall App layout

// Board Configuration (e.g., 36 squares on a 15x5 grid)
const BOARD_CONFIG = {
  H_GRID_CELLS: 15, // Number of columns in the CSS Grid for the board
  V_GRID_CELLS: 5,  // Number of rows in the CSS Grid for the board
  TOTAL_SQUARES: 36, // Total number of playable squares on the perimeter
};

// Initial player data
const initialPlayersData = [
  { id: 1, name: 'Player 1', color: 'var(--player-1-color, blue)', pos: 1, currentDice: null },
  { id: 2, name: 'Player 2', color: 'var(--player-2-color, red)', pos: 1, currentDice: null },
];

function App() {
  // Game State Management
  const [gamePhase, setGamePhase] = useState('setup'); // Initial phase: 'setup', 'rolling', 'moving', 'questioning', 'gameOver'
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1); // Player whose turn it is
  const [currentOverallDiceRoll, setCurrentOverallDiceRoll] = useState(null); // To display on the central dice

  // State for ESL Questions and Game Settings from Setup
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null); // To store { topic, level, structure }
  // const [currentEslQuestion, setCurrentEslQuestion] = useState(null); // For displaying one question at a time

  // Callback function for GameSetup component
  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    console.log("[App.jsx] Questions and settings received from GameSetup:", { fetchedQuestions, settings });
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);

    // Reset game state for a new game
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentOverallDiceRoll(null);

    // Transition to the next phase (will be 'questioning' once QuestionModal is integrated)
    // For now, let's go directly to 'rolling' to see the board game after setup
    setGamePhase('rolling');
    console.log("[App.jsx] Game phase changed to 'rolling'. Questions loaded:", fetchedQuestions.length);
  };

  // Callback function for dice rolling
  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') {
      console.log("[App.jsx] Roll dice attempted but not in 'rolling' phase. Current phase:", gamePhase);
      return;
    }

    console.log(`[App.jsx] Player ${activePlayerId} is rolling dice.`);
    setGamePhase('moving'); // Player is now moving
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentOverallDiceRoll(rollValue);

    // Update the specific player's currentDice value
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === activePlayerId ? { ...p, currentDice: rollValue } : p
      )
    );

    // Simulate movement delay then update position
    setTimeout(() => {
      console.log(`[App.jsx] Player ${activePlayerId} rolled a ${rollValue}. Moving player.`);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + rollValue;
            // Wrap around the board
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = (newPos - BOARD_CONFIG.TOTAL_SQUARES); // Simple wrap
              if (newPos === 0) newPos = BOARD_CONFIG.TOTAL_SQUARES; // if it lands exactly on modulo, it's the last square
            } else if (newPos === BOARD_CONFIG.TOTAL_SQUARES){
              // Landed exactly on the last square, potentially win condition
              console.log(`Player ${p.name} reached the final square!`);
              // setGamePhase('gameOver'); // Implement game over later
            }
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // If game is not over, switch to the next player and prepare for their turn
      // if (gamePhase !== 'gameOver') { // Check if gamePhase was changed by a win condition
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentOverallDiceRoll(null); // Clear the dice display for the next player
        console.log(`[App.jsx] Turn ended for Player ${activePlayerId}. Next player: ${nextPlayerId}. Phase to 'rolling'.`);
        setGamePhase('rolling'); // Next phase will eventually be 'questioning'
      // }
    }, 700); // Movement animation/delay time
  }, [activePlayerId, gamePhase]); // gamePhase added as dependency

  // --- Conditional Rendering based on Game Phase ---

  // 1. If in 'setup' phase, show the GameSetup modal
  if (gamePhase === 'setup') {
    console.log("[App.jsx] Rendering GameSetup component.");
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  // 2. Placeholder for 'questioning' phase (to be implemented next)
  // if (gamePhase === 'questioning' && currentEslQuestion) {
  //   console.log("[App.jsx] Rendering QuestionModal component.");
  //   return (
  //     <div className="esl-game-app-container dimmed-background"> {/* Example: Dim background */}
  //       {/* Render the game board dimly behind the modal if desired */}
  //       {/* <Board ... /> */}
  //       {/* <QuestionModal question={currentEslQuestion} onAnswer={handleQuestionAnswered} /> */}
  //       <p>Question Modal Would Be Here</p>
  //     </div>
  //   );
  // }

  // 3. If not in 'setup' or 'questioning' (i.e., 'rolling', 'moving', 'gameOver'), render the main game UI
  console.log(`[App.jsx] Rendering main game board. Phase: ${gamePhase}, Active Player: ${activePlayerId}`);
  return (
    <div className="esl-game-app-container">
      <header className="game-header-title">
        <h1>ESL Adventure Board Game</h1>
        {gameSettings && ( // Display game settings if they exist
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
            // Player is active if it's their ID and game is in 'rolling' or 'questioning' phase
            // (not active during 'moving' or 'gameOver' or 'setup')
            isActive={player.id === activePlayerId && (gamePhase === 'rolling' || gamePhase === 'questioning')}
            currentSquare={player.pos}
          />
        ))}
      </div>

      <Board
        players={players}
        onRollDice={handleRollDice}
        currentDiceRoll={currentOverallDiceRoll}
        activePlayerId={activePlayerId}
        isRollDisabled={gamePhase !== 'rolling'} // Roll button enabled only in 'rolling' phase
        config={BOARD_CONFIG}
      />

      {/* Optional Debug Info */}
      {/* <div style={{ marginTop: '20px', padding: '10px', background: '#eee', fontSize: '0.8em' }}>
        <p><strong>Debug:</strong> Game Phase: {gamePhase} | Active Player: {activePlayerId}</p>
        <p>Questions Loaded: {eslQuestions.length}</p>
        <p>P1 Pos: {players.find(p=>p.id===1)?.pos}, P2 Pos: {players.find(p=>p.id===2)?.pos}</p>
      </div> */}
    </div>
  );
}

export default App;