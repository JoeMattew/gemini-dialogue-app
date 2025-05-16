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

const CONSEQUENCE_DISPLAY_DURATION = 4000; // How long consequence text is shown by MCQ

function App() {
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); // Used by MCQ to show consequence

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setGamePhase('rolling');
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
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
      setIsProcessingAnswer(false); // Reset for new question, ready for selection
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning' && gamePhase !== 'showingConsequence') { // Keep question if showing consequence
      setCurrentQuestionObj(null);
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    setGamePhase('diceMoving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentDiceRollValue(rollValue);

    setTimeout(() => {
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
      setGamePhase('questioning');
    }, 700);
  }, [activePlayerId, gamePhase]);


  // This function is called by MultipleChoiceQuestion AFTER it has shown the consequence and user clicks "OK/Next Turn"
  const handleAnswerConsequenceProcessed = (processedOption) => {
    if (!processedOption) return; // Should not happen if MCQ calls this
    
    console.log(`[App.jsx] Consequence processed for Team ${activePlayerId}. Applying move: ${processedOption.move}`);
    setGamePhase('consequenceMoving');

    setPlayers(prevPlayers =>
      prevPlayers.map(p => {
        if (p.id === activePlayerId) {
          let newPos = p.pos + processedOption.move;
          if (newPos > BOARD_CONFIG.TOTAL_SQUARES) newPos = BOARD_CONFIG.TOTAL_SQUARES;
          else if (newPos < 1) newPos = 1;
          return { ...p, pos: newPos };
        }
        return p;
      })
    );

    // Short delay for "animation" of this second move
    setTimeout(() => {
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentDiceRollValue(null);
        setQuestionIndex(prev => prev + 1);
        setIsProcessingAnswer(false); // Ready for next player's question cycle
        setCurrentQuestionObj(null); // Clear current question before next turn
        setGamePhase('rolling');
        console.log(`[App.jsx] Consequence move done. Next player: Team ${nextPlayerId}. Phase: 'rolling'.`);
    }, 700); // "Animation" time for consequence move
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
            isActive={player.id === activePlayerId && 
                        gamePhase !== 'diceMoving' && 
                        gamePhase !== 'consequenceMoving' && 
                        gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          showQuestionInBoard={gamePhase === 'questioning' || gamePhase === 'showingConsequence' || gamePhase === 'consequenceMoving'}
          currentQuestionObj={currentQuestionObj}
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerSelect={handleAnswerConsequenceProcessed} // MCQ will call this after its internal "OK/Next Turn"
          isProcessingAnswer={isProcessingAnswer} // This tells MCQ to show consequence and disable its own option buttons
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