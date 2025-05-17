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
const CONSEQUENCE_MOVE_ANIMATION_DURATION = 700;

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'consequenceMoving'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Unified state for what's displayed in the board's center
  // type: 'placeholder', 'question', 'consequence'
  // content: data for the type (e.g., question object, consequence object, or placeholder text)
  // playerName: relevant player's name for the display
  const [boardCenterDisplay, setBoardCenterDisplay] = useState({ type: 'placeholder', content: "Loading game..." });

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setBoardCenterDisplay({ type: 'placeholder', content: "Team 1, Roll the dice!" }); // Initial placeholder for Player 1
    setGamePhase('rolling');
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

  // Effect to set up the question when it's 'questioning' phase
  useEffect(() => {
    const activePlayer = players.find(p => p.id === activePlayerId);
    if (gamePhase === 'questioning' && eslQuestions.length > 0 && activePlayer) {
      let qIndexToShow = questionIndex;
      if (qIndexToShow >= eslQuestions.length) {
        console.warn("[App.jsx] All questions used. Recycling.");
        qIndexToShow = 0;
        setQuestionIndex(0);
      }
      const question = eslQuestions[qIndexToShow];
      if (question) {
        setBoardCenterDisplay({
          type: 'question',
          content: question, // The full question object
          playerName: activePlayer.name
        });
        console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for ${activePlayer.name}`);
      } else {
        console.error("[App.jsx] No question found at index", qIndexToShow);
        setBoardCenterDisplay({ type: 'placeholder', content: "Error loading question.", playerName: activePlayer.name });
      }
    }
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex, players]); // players dependency for activePlayer.name


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;

    const activePlayer = players.find(p => p.id === activePlayerId);
    console.log(`[App.jsx] ${activePlayer?.name || `Team ${activePlayerId}`} rolling dice.`);
    
    // Set placeholder for the rolling player
    setBoardCenterDisplay({ type: 'placeholder', content: `Rolling for ${activePlayer?.name}...`, playerName: activePlayer?.name });
    
    setGamePhase('diceMoving');
    const rollValue = Math.floor(Math.random() * 6) + 1;
    setCurrentDiceRollValue(rollValue);

    setTimeout(() => {
      console.log(`[App.jsx] ${activePlayer?.name} rolled ${rollValue}. Moving (dice).`);
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
      console.log(`[App.jsx] Dice move complete for ${activePlayer?.name}. Phase: 'questioning'.`);
      setGamePhase('questioning'); // This will trigger the useEffect to display the question
    }, 700); // Dice move animation delay
  }, [activePlayerId, gamePhase, players]); // Added players for activePlayer.name in placeholder


  // Called by MultipleChoiceQuestion when an answer option button is clicked
  const handleAnswerSelect = (selectedOption) => {
    if (gamePhase !== 'questioning' || !selectedOption || !boardCenterDisplay || boardCenterDisplay.type !== 'question') return;

    const playerNameWhoAnswered = boardCenterDisplay.forPlayerName; // Name of player who answered
    console.log(`[App.jsx] ${playerNameWhoAnswered} selected: "${selectedOption.optionText}".`);
    
    // Update board center to show consequence
    setBoardCenterDisplay({
        type: 'consequence',
        content: { // Store only what's needed for consequence display
            consequenceText: selectedOption.consequenceText,
            move: selectedOption.move
        },
        forPlayerName: playerNameWhoAnswered // Consequence is for the player who answered
    });
    setGamePhase('consequenceMoving');

    // Apply movement after a short delay (this is the "consequence move animation" time)
    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for ${playerNameWhoAnswered}.`);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) { // The activePlayerId is still the one who answered
            let newPos = p.pos + selectedOption.move;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) newPos = BOARD_CONFIG.TOTAL_SQUARES;
            else if (newPos < 1) newPos = 1;
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // After move, prepare for next player. The consequence display remains.
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      const nextPlayer = players.find(p => p.id === nextPlayerId);

      setActivePlayerId(nextPlayerId);
      setCurrentDiceRollValue(null);
      setQuestionIndex(prev => prev + 1);
      // `boardCenterDisplay` STILL SHOWS THE CONSEQUENCE of the previous player.
      // It will be cleared when the *new* activePlayerId rolls the dice (in handleRollDice).
      setGamePhase('rolling');
      console.log(`[App.jsx] Turn ended for ${playerNameWhoAnswered}. Next player: ${nextPlayer?.name || `Team ${nextPlayerId}`}. Phase: 'rolling'. Previous consequence remains visible.`);
    }, CONSEQUENCE_MOVE_ANIMATION_DURATION);
  };


  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  const activePlayerForControls = players.find(p => p.id === activePlayerId);

  return (
    <div className="esl-game-app-layout">
      <div className="top-player-stats-panel">
        {players.map(player => (
          <Player
            key={player.id}
            teamName={player.name}
            color={player.color}
            isActive={player.id === activePlayerId && 
                        (gamePhase === 'rolling' || gamePhase === 'questioning' || gamePhase === 'diceMoving')}
                        // Highlight active player unless their consequence is being shown for previous turn
                        // Or more simply, always highlight current activePlayerId unless in setup/gameOver
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          boardCenterContent={boardCenterDisplay} // Pass the unified content object
          onAnswerSelect={handleAnswerSelect}
          // Disable MCQ options if board center is not showing a question
          // or if the game is not in the 'questioning' phase.
          disableOptions={!boardCenterDisplay || boardCenterDisplay.type !== 'question' || gamePhase !== 'questioning'}
        />
      </div>

      <GameControls
        currentDiceRoll={currentDiceRollValue}
        onRollDice={handleRollDice}
        activePlayerName={activePlayerForControls?.name || ''}
        isRollDisabled={gamePhase !== 'rolling'}
      />
    </div>
  );
}

export default App;