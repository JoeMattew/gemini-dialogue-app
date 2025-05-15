// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect for logging
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import './App.css';

const BOARD_CONFIG = { /* ... */ };
const initialPlayersData = [ /* ... */ ];

function App() {
  const [gamePhase, setGamePhase] = useState('setup');
  // ... other states ...
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);

  // Log initial gamePhase and any time it changes
  useEffect(() => {
    console.log(`[App.jsx] useEffect: gamePhase changed or component mounted. Current gamePhase: ${gamePhase}`);
    alert(`[App.jsx] Mount/Update. gamePhase: ${gamePhase}`); // Very aggressive alert for deployed debugging
  }, [gamePhase]);


  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    console.log("[App.jsx] handleQuestionsAndSettingsReady CALLED. Questions:", fetchedQuestions?.length, "Settings:", settings);
    alert("[App.jsx] handleQuestionsAndSettingsReady CALLED!"); // Aggressive alert

    setEslQuestions(fetchedQuestions || []); // Ensure it's an array
    setGameSettings(settings || {}); // Ensure it's an object

    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentOverallDiceRoll(null);

    setGamePhase('rolling'); // Transitioning out of setup
    console.log("[App.jsx] gamePhase set to 'rolling' by handleQuestionsAndSettingsReady.");
    alert("[App.jsx] gamePhase set to 'rolling'");
  };

  // ... handleRollDice (keep as is from previous full App.jsx) ...
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


  console.log(`[App.jsx] Rendering. Current gamePhase BEFORE conditional render: ${gamePhase}`);
  alert(`[App.jsx] Rendering. gamePhase: ${gamePhase}`); // Aggressive alert

  if (gamePhase === 'setup') {
    console.log("[App.jsx] Condition MET: gamePhase is 'setup'. Rendering GameSetup.");
    alert("[App.jsx] Condition MET: Rendering GameSetup.");
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  console.log("[App.jsx] Condition NOT MET for setup. Rendering game board. gamePhase:", gamePhase);
  alert("[App.jsx] Condition NOT MET for setup. Rendering game board. gamePhase: " + gamePhase);
  // Render the main game board area
  return (
    <div className="esl-game-app-container">
      {/* ... rest of the game board JSX from previous full App.jsx ... */}
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