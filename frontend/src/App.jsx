// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import QuestionModal from './components/QuestionModal'; // Import the new modal
import './App.css';

const BOARD_CONFIG = {
  H_GRID_CELLS: 15,
  V_GRID_CELLS: 5,
  TOTAL_SQUARES: 36,
};

const initialPlayersData = [
  { id: 1, name: 'Player 1', color: 'var(--player-1-color, blue)', pos: 1, currentDice: null },
  { id: 2, name: 'Player 2', color: 'var(--player-2-color, red)', pos: 1, currentDice: null },
];

function App() {
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'questioning', 'rolling', 'moving', 'gameOver'
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentOverallDiceRoll, setCurrentOverallDiceRoll] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentEslQuestionObj, setCurrentEslQuestionObj] = useState(null); // To store the current question object {text: "..."}
  const [questionIndex, setQuestionIndex] = useState(0); // To cycle through questions

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    console.log("[App.jsx] Questions and settings received:", { fetchedQuestions, settings });
    setEslQuestions(fetchedQuestions); // Store all fetched questions
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentOverallDiceRoll(null);
    setQuestionIndex(0); // Reset question index

    // Start the game by asking the first player a question
    setGamePhase('questioning');
    console.log("[App.jsx] Game phase changed to 'questioning'.");
  };

  // Effect to set the current question when phase is 'questioning' or activePlayerId changes
  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      if (questionIndex >= eslQuestions.length) {
        // Optional: Reshuffle or indicate all questions used
        console.warn("[App.jsx] All questions used. Recycling questions.");
        setQuestionIndex(0); // Loop back to the first question
        setCurrentEslQuestionObj(eslQuestions[0]);
      } else {
        setCurrentEslQuestionObj(eslQuestions[questionIndex]);
      }
      console.log(`[App.jsx] Displaying question #${questionIndex + 1} for Player ${activePlayerId}: "${eslQuestions[questionIndex]?.text}"`);
    } else if (gamePhase !== 'questioning') {
      setCurrentEslQuestionObj(null); // Clear question if not in questioning phase
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  const handleQuestionAnswered = (isCorrect) => {
    console.log(`[App.jsx] Player ${activePlayerId} answered. Correct: ${isCorrect}`);
    setCurrentEslQuestionObj(null); // Hide modal

    if (isCorrect) {
      setGamePhase('rolling'); // Allow current player to roll
      console.log(`[App.jsx] Answer correct. Player ${activePlayerId} can roll. Phase: 'rolling'`);
    } else {
      // Penalty: Skip turn, move to next player's question phase
      console.log(`[App.jsx] Answer incorrect. Skipping turn for Player ${activePlayerId}.`);
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setQuestionIndex(prev => prev + 1); // Move to next question for next player
      setGamePhase('questioning'); // Ask next player a question
    }
  };

  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    console.log(`[App.jsx] Player ${activePlayerId} is rolling dice.`);
    setGamePhase('moving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentOverallDiceRoll(rollValue);
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === activePlayerId ? { ...p, currentDice: rollValue } : p
      )
    );

    setTimeout(() => {
      console.log(`[App.jsx] Player ${activePlayerId} rolled ${rollValue}. Moving player.`);
      let gameIsOver = false;
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + rollValue;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = (newPos % BOARD_CONFIG.TOTAL_SQUARES);
              if (newPos === 0) newPos = BOARD_CONFIG.TOTAL_SQUARES;
              // You might add "pass Go" logic here if needed
            }
            if (newPos === BOARD_CONFIG.TOTAL_SQUARES) { // Example win condition
              // alert(`Player ${p.name} wins!`);
              // gameIsOver = true;
              // setGamePhase('gameOver');
            }
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      if (!gameIsOver) { // Only proceed if game is not over
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentOverallDiceRoll(null);
        setQuestionIndex(prev => prev + 1); // Prepare next question index
        setGamePhase('questioning'); // Next player's turn starts with a question
        console.log(`[App.jsx] Turn ended for Player ${activePlayerId}. Next player: ${nextPlayerId}. Phase: 'questioning'.`);
      }
    }, 700);
  }, [activePlayerId, gamePhase]); // Keep gamePhase here for the initial check

  // --- Conditional Rendering ---

  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  // Main game layout (board, players, and potentially question modal overlayed)
  return (
    <div className="esl-game-app-container">
      {gamePhase === 'questioning' && currentEslQuestionObj && (
        <QuestionModal
          questionText={currentEslQuestionObj.text}
          playerName={players.find(p => p.id === activePlayerId)?.name || 'Player'}
          onAnswer={handleQuestionAnswered}
        />
      )}

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
        isRollDisabled={gamePhase !== 'rolling'} // Button enabled only in 'rolling' phase
        config={BOARD_CONFIG}
      />
    </div>
  );
}

export default App;