// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
// GameControls is removed
import './App.css';

const BOARD_CONFIG = {
  H_GRID_CELLS: 15,
  V_GRID_CELLS: 5,
  TOTAL_SQUARES: 36,
};

const initialPlayersData = [
  { id: 1, name: 'Team 1', color: 'var(--player-1-color, #3498db)', pos: 1 },
  { id: 2, name: 'Team 2', color: 'var(--player-2-color, #e74c3c)', pos: 1 },
];

function App() {
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'questioning', 'processingAnswer', 'gameOver'
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null); // Stores the full question object
  const [questionIndex, setQuestionIndex] = useState(0);

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setQuestionIndex(0);
    setGamePhase('questioning');
    console.log("[App.jsx] Setup complete. Phase: 'questioning'. Questions loaded:", fetchedQuestions.length);
  };

  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]);
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning') {
      setCurrentQuestionObj(null);
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  // Called by MultipleChoiceQuestion when an answer option is selected (via the "OK / Next Turn" button)
  const handleAnswerSelected = (selectedOption) => {
    if (!selectedOption || gamePhase !== 'questioning') return;

    console.log(`[App.jsx] Team ${activePlayerId} chose: "${selectedOption.optionText}". Consequence: ${selectedOption.consequenceText}, Move: ${selectedOption.move}`);
    setGamePhase('processingAnswer'); // Indicate we are processing the move

    // Apply movement
    setTimeout(() => { // Short delay to simulate processing/animation
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + selectedOption.move;
            // Boundary checks and wrapping logic
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) {
              newPos = BOARD_CONFIG.TOTAL_SQUARES; // Stop at the end
            } else if (newPos < 1) {
              newPos = 1; // Stop at the beginning
            }
            // TODO: Add win condition check if newPos reaches end
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // Switch to next player
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setQuestionIndex(prev => prev + 1); // Prepare for next question
      setGamePhase('questioning'); // Next player's turn starts with a new question
      console.log(`[App.jsx] Move processed. Next player: Team ${nextPlayerId}. Phase: 'questioning'.`);
    }, 700); // Delay for "movement" or showing consequence briefly
  };


  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  const activePlayerForDisplay = players.find(p => p.id === activePlayerId);

  return (
    <div className="esl-game-app-layout">
      <div className="top-player-stats-panel">
        {players.map(player => (
          <Player
            key={player.id}
            teamName={player.name}
            color={player.color}
            isActive={player.id === activePlayerId && gamePhase !== 'processingAnswer' && gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          showQuestionInBoard={gamePhase === 'questioning' || gamePhase === 'processingAnswer'} // Show during these phases
          currentQuestionObj={currentQuestionObj} // Pass the full object
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerSelect={handleAnswerSelected} // New prop for Board to pass to MCQ
        />
      </div>

      {/* GameControls component for dice and roll button is removed */}
      {/* We can add a status bar or turn indicator at the bottom if needed */}
      {/* <div className="game-status-bar">
        {gamePhase === 'processingAnswer' && <p>Processing move...</p>}
      </div> */}
    </div>
  );
}

export default App;