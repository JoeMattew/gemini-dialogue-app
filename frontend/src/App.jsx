// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls';
import './App.css'; // Ensure your App.css has layout styles

const BOARD_CONFIG = {
  H_GRID_CELLS: 15,
  V_GRID_CELLS: 5,
  TOTAL_SQUARES: 36,
};

const initialPlayersData = [
  { id: 1, name: 'Team 1', color: 'var(--player-1-color, #3498db)', pos: 1 },
  { id: 2, name: 'Team 2', color: 'var(--player-2-color, #e74c3c)', pos: 1 },
];

// No CONSEQUENCE_DISPLAY_DURATION here, as MCQ handles its own display timing before calling back

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'consequenceMoving', 'gameOver'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null); // Full question object
  const [questionIndex, setQuestionIndex] = useState(0);
  // isProcessingAnswer is removed from App state, as MCQ manages its own internal state for showing consequence

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

  // Effect to select and set the current question when phase is 'questioning'
  useEffect(() => {
    if (gamePhase === 'questioning' && eslQuestions.length > 0) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0); // Reset index for next cycle
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]); // Set the full question object
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning') {
      // Clear question if not in questioning phase to ensure placeholder shows in Board center
      setCurrentQuestionObj(null);
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex]);


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    setGamePhase('diceMoving');
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


  // This function is called by MultipleChoiceQuestion's "OK / Next Turn" button,
  // AFTER the player has seen the consequence.
  const handleAnswerFinalized = (finalizedOption) => {
    console.log("[App.jsx] handleAnswerFinalized CALLED. Option selected by player:", finalizedOption);

    if (!finalizedOption || typeof finalizedOption.move === 'undefined') {
      console.error("[App.jsx] Invalid option received in handleAnswerFinalized:", finalizedOption);
      // Failsafe: If something went wrong, move to next player's rolling phase to avoid getting stuck
      const nextPlayerIdOnError = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerIdOnError);
      setQuestionIndex(prev => prev + 1);
      setCurrentQuestionObj(null); // Clear question
      setGamePhase('rolling');
      console.warn("[App.jsx] Invalid option from MCQ. Resetting to rolling for next player.");
      return;
    }

    setGamePhase('consequenceMoving'); // Indicate game is now applying the consequence move
    console.log(`[App.jsx] Applying consequence move: ${finalizedOption.move} for Team ${activePlayerId}.`);

    // Apply the move from the consequence
    setPlayers(prevPlayers =>
      prevPlayers.map(p => {
        if (p.id === activePlayerId) {
          let newPos = p.pos + finalizedOption.move;
          // Boundary checks for the new position
          if (newPos > BOARD_CONFIG.TOTAL_SQUARES) newPos = BOARD_CONFIG.TOTAL_SQUARES;
          else if (newPos < 1) newPos = 1;
          return { ...p, pos: newPos };
        }
        return p;
      })
    );
    
    // Short delay for the "animation" or visual registration of the consequence move
    setTimeout(() => {
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentDiceRollValue(null);    // Clear dice display for next player
        setQuestionIndex(prev => prev + 1); // Prepare for next question
        setCurrentQuestionObj(null);      // Clear current question object

        console.log(`[App.jsx] Consequence move done. Next player: Team ${nextPlayerId}. Phase set to 'rolling'.`);
        setGamePhase('rolling'); // Next player's turn starts with an opportunity to roll
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
          showQuestionInBoard={gamePhase === 'questioning'} // Show MCQ only in 'questioning' phase
          currentQuestionObj={currentQuestionObj}
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerFinalized={handleAnswerFinalized} // Pass the correct handler
          // Props like isQuestionButtonsDisabled, isShowingConsequence, chosenOptionForConsequence are now internal to MCQ
        />
      </div>

      <GameControls
        currentDiceRoll={currentDiceRollValue}
        onRollDice={handleRollDice}
        activePlayerName={activePlayerForDisplay?.name || ''}
        isRollDisabled={gamePhase !== 'rolling'} // Roll button active only in 'rolling' phase
      />
    </div>
  );
}

export default App;