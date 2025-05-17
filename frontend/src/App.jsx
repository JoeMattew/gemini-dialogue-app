// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls';
import './App.css';

const BOARD_CONFIG = { H_GRID_CELLS: 15, V_GRID_CELLS: 5, TOTAL_SQUARES: 36 };
const initialPlayersData = [
  { id: 1, name: 'Team 1', color: 'var(--player-1-color, #3498db)', pos: 1 },
  { id: 2, name: 'Team 2', color: 'var(--player-2-color, #e74c3c)', pos: 1 },
];
const CONSEQUENCE_VISIBILITY_DURATION_BEFORE_MOVE = 3000; // How long to show consequence text before moving piece
const CONSEQUENCE_MOVE_ANIMATION_DURATION = 700;      // How long the piece "moves" after consequence

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'showingConsequence', 'consequenceMoving'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null); // Full question {text, options}
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentConsequence, setCurrentConsequence] = useState(null); // { consequenceText, move }

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setCurrentConsequence(null);
    setGamePhase('rolling');
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

  // Effect to set the current question when it's 'questioning' phase
  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]);
      setCurrentConsequence(null); // Make sure no old consequence is shown with new question
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    }
    // If not 'questioning' AND not 'showingConsequence', clear question object
    // This allows consequence to persist until next player rolls
    else if (gamePhase !== 'questioning' && gamePhase !== 'showingConsequence') {
        setCurrentQuestionObj(null);
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]); // Trigger when these change


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    
    setCurrentConsequence(null); // *** CRITICAL: Clear previous player's consequence ***
    setCurrentQuestionObj(null); // Clear any potential stale question object
    
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


  // Called by MultipleChoiceQuestion when an answer option button is clicked
  const handleAnswerSelect = (selectedOption) => {
    if (gamePhase !== 'questioning' || !selectedOption) return;

    const activePlayer = players.find(p => p.id === activePlayerId);
    console.log(`[App.jsx] Team ${activePlayer?.name || activePlayerId} selected: "${selectedOption.optionText}".`);
    
    setCurrentConsequence({ // Store consequence for display
        consequenceText: selectedOption.consequenceText,
        move: selectedOption.move
    });
    setCurrentQuestionObj(null); // Question is answered, clear it to show only consequence
    setGamePhase('showingConsequence'); // Phase to display the consequence text

    // After showing consequence, apply move and then end turn for next player's 'rolling' phase
    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for Team ${activePlayerId}.`);
      setGamePhase('consequenceMoving'); // Short phase for the move itself

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

      // After move animation, setup for next player
      setTimeout(() => {
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentDiceRollValue(null);
        setQuestionIndex(prev => prev + 1);
        // `currentConsequence` remains visible until the new active player rolls dice.
        // `currentQuestionObj` is already null.
        setGamePhase('rolling'); // Next player is now ready to roll
        console.log(`[App.jsx] Consequence move done. Next player: Team ${nextPlayerId}. Phase: 'rolling'. Consequence for previous player may still be visible.`);
      }, CONSEQUENCE_MOVE_ANIMATION_DURATION);

    }, CONSEQUENCE_VISIBILITY_DURATION_BEFORE_MOVE);
  };


  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  const activePlayerForDisplay = players.find(p => p.id === activePlayerId);
  // Determine whose name to show with the question/consequence
  // If showing consequence, it's for the player who just answered, which might *not* be current activePlayerId if turn just switched.
  // This needs to be handled carefully. Let's pass the name of the player the content *relates* to.
  let playerNameForBoardCenter;
  if (gamePhase === 'questioning') {
      playerNameForBoardCenter = activePlayerForDisplay?.name;
  } else if (gamePhase === 'showingConsequence' || gamePhase === 'consequenceMoving') {
      // The consequence is for the player whose turn it *was* when they answered.
      // `activePlayerId` would have already switched if we're in consequenceMoving's final step.
      // So, we need to find the player who *was* active.
      // For simplicity during `showingConsequence` and `consequenceMoving`, let's assume the `activePlayerId`
      // still refers to the player who triggered the consequence. This is true until the very end of `handleAnswerSelect`.
      playerNameForBoardCenter = activePlayerForDisplay?.name;
  }


  return (
    <div className="esl-game-app-layout">
      <div className="top-player-stats-panel">
        {players.map(player => (
          <Player
            key={player.id}
            teamName={player.name}
            color={player.color}
            isActive={player.id === activePlayerId && 
                        (gamePhase === 'rolling' || gamePhase === 'questioning')}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          // showQuestionArea: True if there's a question OR a consequence to display
          showQuestionArea={gamePhase === 'questioning' || gamePhase === 'showingConsequence'}
          currentQuestionObj={gamePhase === 'questioning' ? currentQuestionObj : null}
          activePlayerNameForQuestion={playerNameForBoardCenter || ''}
          onAnswerSelect={handleAnswerSelect}
          
          isDisplayingConsequence={gamePhase === 'showingConsequence'}
          consequenceToShow={gamePhase === 'showingConsequence' ? currentConsequence : null}
          disableOptions={gamePhase !== 'questioning'} // Options disabled if not actively questioning
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