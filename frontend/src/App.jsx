// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
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
  // Alert immediately to see initial state attempt
  // alert("[App.jsx] Component function body starting. Attempting to set initial gamePhase to 'setup'.");
  const [gamePhase, setGamePhase] = useState(() => {
    // Using a function for useState ensures this only runs once on init
    const initialPhase = 'setup';
    // alert(`[App.jsx] useState initializer: Setting initial gamePhase to: ${initialPhase}`);
    console.log(`[App.jsx] useState initializer: Setting initial gamePhase to: ${initialPhase}`);
    return initialPhase;
  });

  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentOverallDiceRoll, setCurrentOverallDiceRoll] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);

  // Log gamePhase on every render and when it changes
  useEffect(() => {
    console.log(`[App.jsx] useEffect[gamePhase]: gamePhase is now: ${gamePhase}`);
    // alert(`[App.jsx] useEffect[gamePhase]: gamePhase is now: ${gamePhase}`);
  }, [gamePhase]);

  // Log on initial mount only
  useEffect(() => {
    console.log("[App.jsx] useEffect[]: Component Did Mount.");
    // alert("[App.jsx] useEffect[]: Component Did Mount.");
  }, []);


  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    console.log("[App.jsx] handleQuestionsAndSettingsReady CALLED. Questions:", fetchedQuestions?.length, "Settings:", settings);
    // alert("[App.jsx] handleQuestionsAndSettingsReady CALLED!");

    setEslQuestions(fetchedQuestions || []);
    setGameSettings(settings || {});
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentOverallDiceRoll(null);
    setGamePhase('rolling');
    console.log("[App.jsx] gamePhase set to 'rolling' by handleQuestionsAndSettingsReady.");
    // alert("[App.jsx] gamePhase set to 'rolling' by handleQuestionsAndSettingsReady.");
  };

  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') {
      console.log("[App.jsx] Roll dice attempted but not in 'rolling' phase. Current phase:", gamePhase);
      return;
    }
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
      console.log(`[App.jsx] Player ${activePlayerId} rolled a ${rollValue}. Moving player.`);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + rollValue;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = (newPos % BOARD_CONFIG.TOTAL_SQUARES) || BOARD_CONFIG.TOTAL_SQUARES;
            }
            return { ...p, pos: newPos };
          }
          return p;
        })
      );
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setCurrentOverallDiceRoll(null);
      console.log(`[App.jsx] Turn ended for Player ${activePlayerId}. Next player: ${nextPlayerId}. Phase to 'rolling'.`);
      setGamePhase('rolling');
    }, 700);
  }, [activePlayerId, gamePhase]);


  console.log(`[App.jsx] --- Render --- Current gamePhase BEFORE conditional render: ${gamePhase}`);
  // alert(`[App.jsx] --- Render --- Current gamePhase: ${gamePhase}`); // Critical alert

  if (gamePhase === 'setup') {
    console.log("[App.jsx] Condition MET: gamePhase is 'setup'. Rendering GameSetup.");
    // alert("[App.jsx] Rendering GameSetup.");
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  // If it reaches here, gamePhase is NOT 'setup'
  console.log("[App.jsx] Condition NOT MET for setup. Rendering game board. gamePhase:", gamePhase);
  // alert("[App.jsx] Rendering game board. gamePhase was: " + gamePhase);
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
        isRollDisabled={gamePhase !== 'rolling'}
        config={BOARD_CONFIG}
      />
    </div>
  );
}

export default App;