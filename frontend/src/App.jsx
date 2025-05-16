// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls'; // Re-add GameControls
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

const CONSEQUENCE_DISPLAY_DURATION = 4000; // 4 seconds to show consequence

function App() {
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'rolling', 'diceMoving', 'questioning', 'processingAnswer', 'turnEnd'
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); // To show consequence and disable buttons

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setGamePhase('rolling'); // Start with rolling phase for Player 1
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

  // Selects question for the 'questioning' phase
  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]);
      setIsProcessingAnswer(false); // Ready for an answer
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning') {
      setCurrentQuestionObj(null); // Clear question if not in questioning phase
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    setGamePhase('diceMoving'); // Phase for dice roll movement
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentDiceRollValue(rollValue);

    setTimeout(() => { // Simulate dice roll and initial move
      console.log(`[App.jsx] Team ${activePlayerId} rolled ${rollValue}. Moving (dice).`);
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
      console.log(`[App.jsx] Dice move complete for Team ${activePlayerId}. Phase: 'questioning'.`);
      setGamePhase('questioning'); // After dice move, present a question
    }, 700); // Dice move animation delay
  }, [activePlayerId, gamePhase]);


  const handleAnswerSelected = (selectedOption) => {
    if (gamePhase !== 'questioning' || isProcessingAnswer || !selectedOption) return;

    console.log(`[App.jsx] Team ${activePlayerId} chose: "${selectedOption.optionText}". Consequence: ${selectedOption.consequenceText}, Move: ${selectedOption.move}`);
    setIsProcessingAnswer(true); // Show consequence, disable option buttons
    setGamePhase('processingAnswer');

    // Delay to show consequence, then move, then end turn
    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for Team ${activePlayerId}.`);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) {
            let newPos = p.pos + selectedOption.move;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) newPos = BOARD_CONFIG.TOTAL_SQUARES;
            else if (newPos < 1) newPos = 1;
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // End turn and prepare for next player
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setCurrentDiceRollValue(null); // Clear dice from previous roll
      setQuestionIndex(prev => prev + 1);
      setIsProcessingAnswer(false); // Reset for next question
      setGamePhase('rolling'); // Next player starts their turn by rolling
      console.log(`[App.jsx] Consequence move complete. Next player: Team ${nextPlayerId}. Phase: 'rolling'.`);
    }, CONSEQUENCE_DISPLAY_DURATION);
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
            isActive={player.id === activePlayerId && gamePhase !== 'diceMoving' && gamePhase !== 'processingAnswer' && gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          showQuestionInBoard={gamePhase === 'questioning' || gamePhase === 'processingAnswer'}
          currentQuestionObj={currentQuestionObj}
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerSelect={handleAnswerSelected}
          isProcessingAnswer={isProcessingAnswer}
        />
      </div>

      <GameControls
        currentDiceRoll={currentDiceRollValue}
        onRollDice={handleRollDice}
        activePlayerName={activePlayerForDisplay?.name || ''}
        isRollDisabled={gamePhase !== 'rolling'} // Roll button only active in 'rolling' phase
      />
    </div>
  );
}

export default App;