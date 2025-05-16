// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls'; // Import GameControls
// QuestionModal is replaced by CentralQuestionDisplay which is inside Board
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
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null); // Kept for potential future use or reference
  const [currentEslQuestionText, setCurrentEslQuestionText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings); // Store settings
    setPlayers(initialPlayersData); // Reset players
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setGamePhase('questioning'); // Start with a question for Player 1
    console.log("[App.jsx] Setup complete. Phase: 'questioning'. Questions loaded:", fetchedQuestions.length);
  };

  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (questionIndex >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      setCurrentEslQuestionText(eslQuestions[qIndexToShow]?.text || "No questions loaded or end of list.");
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning') {
      setCurrentEslQuestionText(''); // Clear question text when not in questioning phase
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);

  // Called by CentralQuestionDisplay's "Continue" button
  const handleQuestionContinue = () => {
    console.log(`[App.jsx] Question acknowledged by Team ${activePlayerId}. Phase: 'rolling'`);
    setCurrentEslQuestionText(''); // Clear question
    setGamePhase('rolling'); // Allow current player to roll
  };

  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    console.log(`[App.jsx] Team ${activePlayerId} rolling.`);
    setGamePhase('moving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentDiceRollValue(rollValue); // For the bottom dice display

    setTimeout(() => {
      console.log(`[App.jsx] Team ${activePlayerId} rolled ${rollValue}. Moving.`);
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
      setCurrentDiceRollValue(null); // Clear dice for next turn
      setQuestionIndex(prev => prev + 1); // Prepare for next question
      setGamePhase('questioning'); // Next turn starts with a question
      console.log(`[App.jsx] Turn ended. Next player: Team ${nextPlayerId}. Phase: 'questioning'.`);
    }, 700); // Movement delay
  }, [activePlayerId, gamePhase]);


  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  const activePlayerForDisplay = players.find(p => p.id === activePlayerId);

  return (
    <div className="esl-game-app-layout"> {/* Updated main class name */}
      <div className="top-player-stats-panel">
        {players.map(player => (
          <Player
            key={player.id}
            teamName={player.name} // Changed from name to teamName
            color={player.color}
            isActive={player.id === activePlayerId && gamePhase !== 'moving' && gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main"> {/* Wrapper to control board width */}
        <Board
          players={players}
          config={BOARD_CONFIG}
          showQuestionInBoard={gamePhase === 'questioning'}
          currentQuestionText={currentEslQuestionText}
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onQuestionContinue={handleQuestionContinue}
        />
      </div>

      <GameControls
        currentDiceRoll={currentDiceRollValue}
        onRollDice={handleRollDice}
        activePlayerName={activePlayerForDisplay?.name || ''}
        isRollDisabled={gamePhase !== 'rolling'}
      />
    </div>
  );
}

export default App;