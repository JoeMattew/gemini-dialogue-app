// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls';
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

const QUESTION_DISPLAY_DURATION = 7000; // 7 seconds to read the question

function App() {
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentEslQuestionText, setCurrentEslQuestionText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setGamePhase('questioning');
    console.log("[App.jsx] Setup complete. Phase: 'questioning'. Questions loaded:", fetchedQuestions.length);
  };

  useEffect(() => {
    let questionTimer; // To hold the setTimeout ID

    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) { // Use qIndexToShow for the check
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0); // Reset index for next cycle
      }
      
      const questionToDisplay = eslQuestions[qIndexToShow]?.text;
      setCurrentEslQuestionText(questionToDisplay || "No more questions available (or error).");
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} ('${questionToDisplay}') for Team ${activePlayerId}`);

      // Automatically move to rolling phase after a delay
      questionTimer = setTimeout(() => {
        // Check if still in questioning phase for THIS question/player,
        // to avoid issues if something else changed the phase.
        if (gamePhase === 'questioning' && activePlayerId === players.find(p => p.id === activePlayerId)?.id ) { // Check against current active player
            console.log("[App.jsx] Question display time ended. Moving to rolling phase for Team", activePlayerId);
            setCurrentEslQuestionText(''); // Clear question text
            setGamePhase('rolling');
        }
      }, QUESTION_DISPLAY_DURATION);

    } else if (gamePhase !== 'questioning') {
      setCurrentEslQuestionText(''); // Clear question if not in questioning phase
    }

    return () => { // Cleanup function for useEffect
      clearTimeout(questionTimer); // Clear the timer if component unmounts or dependencies change
    };
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]); // Rerun when these change (questionIndex added)


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    console.log(`[App.jsx] Team ${activePlayerId} rolling.`);
    setGamePhase('moving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentDiceRollValue(rollValue);

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
      setCurrentDiceRollValue(null);
      setQuestionIndex(prev => prev + 1);
      setGamePhase('questioning');
      console.log(`[App.jsx] Turn ended. Next player: Team ${nextPlayerId}. Phase: 'questioning'.`);
    }, 700);
  }, [activePlayerId, gamePhase]);


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
            isActive={player.id === activePlayerId && gamePhase !== 'moving' && gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          showQuestionInBoard={gamePhase === 'questioning'}
          currentQuestionText={currentEslQuestionText} // Pass the actual question text
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          // onQuestionContinue prop removed from Board
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