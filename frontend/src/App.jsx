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

const CONSEQUENCE_DISPLAY_DURATION = 4000; // 4 seconds to show consequence

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'showingConsequence', 'consequenceMoving', 'gameOver'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [currentQuestionObj, setCurrentQuestionObj] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chosenAnswerOption, setChosenAnswerOption] = useState(null); // To store the option object clicked by player

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
        setQuestionIndex(0);
      }
      setCurrentQuestionObj(eslQuestions[qIndexToShow]);
      setChosenAnswerOption(null); // Clear any previously chosen answer for the new question
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for Team ${activePlayerId}`);
    } else if (gamePhase !== 'questioning' && gamePhase !== 'showingConsequence') {
      // Clear question if not in a phase that shows it
      setCurrentQuestionObj(null);
      setChosenAnswerOption(null);
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
      setGamePhase('questioning'); // After dice move, present a question
    }, 700);
  }, [activePlayerId, gamePhase]);


  // Called by MultipleChoiceQuestion when an answer option button is clicked
  const handleAnswerSelect = (selectedOption) => {
    if (gamePhase !== 'questioning' || !selectedOption) return;

    console.log(`[App.jsx] Team ${activePlayerId} selected option: "${selectedOption.optionText}"`);
    setChosenAnswerOption(selectedOption); // Store the chosen option to display its consequence
    setGamePhase('showingConsequence');    // New phase to explicitly show consequence

    // After showing consequence for a duration, apply the move and end turn
    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for Team ${activePlayerId}.`);
      setGamePhase('consequenceMoving'); // Indicate consequence move is happening

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

      // Short delay for the consequence move "animation"
      setTimeout(() => {
        const nextPlayerId = activePlayerId === 1 ? 2 : 1;
        setActivePlayerId(nextPlayerId);
        setCurrentDiceRollValue(null);
        setQuestionIndex(prev => prev + 1);
        setChosenAnswerOption(null); // Clear chosen option for next turn
        setGamePhase('rolling'); // Next player starts their turn by rolling
        console.log(`[App.jsx] Consequence move complete. Next player: Team ${nextPlayerId}. Phase: 'rolling'.`);
      }, 700); // Consequence move animation delay

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
          showQuestionInBoard={gamePhase === 'questioning' || gamePhase === 'showingConsequence'}
          currentQuestionObj={currentQuestionObj}
          activePlayerNameForQuestion={activePlayerForDisplay?.name || ''}
          onAnswerSelect={handleAnswerSelect}
          isQuestionButtonsDisabled={gamePhase === 'showingConsequence' || gamePhase === 'consequenceMoving'} // Disable options once one is picked
          isShowingConsequence={gamePhase === 'showingConsequence' || gamePhase === 'consequenceMoving'}
          chosenOptionForConsequence={chosenAnswerOption}
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