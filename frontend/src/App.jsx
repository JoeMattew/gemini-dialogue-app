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
// CONSEQUENCE_VISIBILITY_DURATION is no longer needed here, as user action (next player's roll) clears it.

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'showingConsequenceThenMoving', 'turnEnded', 'gameOver'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentConsequence, setCurrentConsequence] = useState(null); // Stores { consequenceText, move }

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setCurrentConsequence(null);
    setGamePhase('rolling'); // Player 1 starts by being able to roll
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

  // Effect to select question for 'questioning' phase
  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]);
      setCurrentConsequence(null); // Crucial: Clear old consequence when new question appears
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning' && gamePhase !== 'showingConsequenceThenMoving') {
      // Clear question if not in a phase that shows it (but keep consequence if showing that)
      setCurrentQuestionObj(null);
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    
    setCurrentConsequence(null); // Clear any leftover consequence from previous turn
    setCurrentQuestionObj(null); // Clear any leftover question (board center shows placeholder)
    
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
      setGamePhase('questioning'); // After dice move, present a question
    }, 700);
  }, [activePlayerId, gamePhase]);


  // Called by MultipleChoiceQuestion when an answer option button is clicked
  const handleAnswerSelect = (selectedOption) => {
    if (gamePhase !== 'questioning' || !selectedOption) return;

    console.log(`[App.jsx] Team ${activePlayerId} selected: "${selectedOption.optionText}".`);
    setCurrentConsequence({ // Store consequence for display
        consequenceText: selectedOption.consequenceText,
        move: selectedOption.move
    });
    setCurrentQuestionObj(null); // Hide the question options, only consequence will be shown by Board
    setGamePhase('showingConsequenceThenMoving'); // New phase to show consequence AND then move

    // Apply movement after a short delay (to allow consequence text to be seen briefly BEFORE move)
    // This timeout is for the *visual delay* before the consequence move happens
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

      // After the move, the consequence is still visible.
      // The turn effectively ends here. The next player's "Roll Dice" action will clear it.
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setCurrentDiceRollValue(null); // Clear dice display for next player
      setQuestionIndex(prev => prev + 1); // Prepare for next question for next player
      // DO NOT clear currentConsequence here. It stays until next player rolls.
      // DO NOT clear currentQuestionObj, it's already null.
      setGamePhase('rolling'); // Set to 'rolling' for the NEXT player.
      console.log(`[App.jsx] Consequence move done. Consequence still visible. Next player: Team ${nextPlayerId}. Phase: 'rolling'.`);

    }, 1500); // Delay before applying consequence move, allows reading consequence text. Adjust as needed.
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
                        // gamePhase !== 'consequenceMoving' && // This phase no longer exists as separate
                        gamePhase !== 'setup'}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          // Determine what to show in the center of the board
          showQuestionArea={gamePhase === 'questioning' || gamePhase === 'showingConsequenceThenMoving'}
          currentQuestionObj={gamePhase === 'questioning' ? currentQuestionObj : null} // Only pass question if in 'questioning'
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerSelect={handleAnswerSelect}
          
          // Props for MultipleChoiceQuestion to display either question or consequence
          isDisplayingConsequence={gamePhase === 'showingConsequenceThenMoving'}
          consequenceToShow={gamePhase === 'showingConsequenceThenMoving' ? currentConsequence : null}
          disableOptionsDuringConsequence={gamePhase === 'showingConsequenceThenMoving'}
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