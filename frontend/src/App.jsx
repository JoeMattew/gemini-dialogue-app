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

// No global CONSEQUENCE_DISPLAY_DURATION, MCQ will handle its own display if needed for animation.

function App() {
  // Game Phases: 'setup', 'rolling', 'diceMoving', 'questioning', 'consequenceMoving'
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState(initialPlayersData);
  const [activePlayerId, setActivePlayerId] = useState(1);
  const [currentDiceRollValue, setCurrentDiceRollValue] = useState(null);
  const [eslQuestions, setEslQuestions] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  
  // Unified state for what's shown in the board's center
  // type: 'question', 'consequence', or null (for placeholder like "Roll dice")
  // content: the question object or consequence object
  // forPlayerName: name of the player this content relates to
  const [boardCenterContent, setBoardCenterContent] = useState(null);


  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    setBoardCenterContent(null); // Clear center content
    setGamePhase('rolling');
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

  // This useEffect now primarily manages setting the question when it's time
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
      setBoardCenterContent({
        type: 'question',
        content: question, // Pass the full question object
        forPlayerName: activePlayer.name
      });
      console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for ${activePlayer.name}`);
    }
    // `boardCenterContent` is cleared at the start of `handleRollDice` for the new turn
    // or when `handleAnswerSelect` sets it to display a consequence.
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex, players]); // Added players to get activePlayer.name


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    console.log(`[App.jsx] Team ${activePlayerId} rolling dice.`);
    
    setBoardCenterContent(null); // Clear previous player's consequence/question
    
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
    // Ensure we are in the questioning phase and an option is actually selected
    if (gamePhase !== 'questioning' || !selectedOption || !boardCenterContent || boardCenterContent.type !== 'question') return;

    const currentPlayerName = boardCenterContent.forPlayerName; // Get name from when question was set
    console.log(`[App.jsx] Team ${currentPlayerName} selected: "${selectedOption.optionText}".`);
    
    // Display the consequence immediately
    setBoardCenterContent({
        type: 'consequence',
        content: { // Store only what's needed for consequence display
            consequenceText: selectedOption.consequenceText,
            move: selectedOption.move
        },
        forPlayerName: currentPlayerName
    });
    setGamePhase('consequenceMoving'); // Phase to apply move and switch turn

    // Apply movement after a short delay to let user read consequence.
    // This timeout is for the GAME LOGIC to proceed, not just visuals.
    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for Team ${currentPlayerName}.`);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          if (p.id === activePlayerId) { // Move the currently active player
            let newPos = p.pos + selectedOption.move;
            if (newPos > BOARD_CONFIG.TOTAL_SQUARES) newPos = BOARD_CONFIG.TOTAL_SQUARES;
            else if (newPos < 1) newPos = 1;
            return { ...p, pos: newPos };
          }
          return p;
        })
      );

      // The consequence remains displayed via boardCenterContent.
      // Prepare for the next player's turn.
      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      setActivePlayerId(nextPlayerId);
      setCurrentDiceRollValue(null);
      setQuestionIndex(prev => prev + 1);
      // `boardCenterContent` (which shows the consequence) will be cleared by the next player's `handleRollDice`.
      setGamePhase('rolling'); // Next player is now in 'rolling' phase
      console.log(`[App.jsx] Consequence move done. Next player: Team ${nextPlayerId}. Phase: 'rolling'. Consequence still visible.`);
    }, 1500); // Delay AFTER consequence is shown, before turn officially ends. Adjust as needed.
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
                        // 'consequenceMoving' means the current active player just made a move,
                        // but the *next* active player is already set.
                        // So, highlight the player whose turn it will be to roll.
                        (gamePhase === 'rolling' || gamePhase === 'questioning')}
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          boardCenterContent={boardCenterContent} // Pass the unified content object
          onAnswerSelect={handleAnswerSelect}
          // Disable MCQ options if not in 'questioning' phase or if content isn't a question
          disableOptions={gamePhase !== 'questioning' || (boardCenterContent && boardCenterContent.type !== 'question')}
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