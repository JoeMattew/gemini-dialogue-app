// frontend/src/App.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Player from './components/Player';
import Board from './components/Board';
import GameSetup from './components/GameSetup';
import GameControls from './components/GameControls';
import './App.css'; // Ensure your App.css has layout styles

const BOARD_CONFIG = { H_GRID_CELLS: 15, V_GRID_CELLS: 5, TOTAL_SQUARES: 36 };
const initialPlayersData = [
  { id: 1, name: 'Team 1', color: 'var(--player-1-color, #0096FF)', pos: 1 }, // Brighter colors for dark theme
  { id: 2, name: 'Team 2', color: 'var(--player-2-color, #FF3131)', pos: 1 },
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
  const [boardCenterDisplay, setBoardCenterDisplay] = useState({ type: 'placeholder', content: "Loading game..." });

  const handleQuestionsAndSettingsReady = (fetchedQuestions, settings) => {
    setEslQuestions(fetchedQuestions);
    setGameSettings(settings);
    setPlayers(initialPlayersData);
    setActivePlayerId(1);
    setCurrentDiceRollValue(null);
    setQuestionIndex(0);
    const firstPlayerName = initialPlayersData.find(p => p.id === 1)?.name || 'Team 1';
    setBoardCenterDisplay({ type: 'placeholder', content: `${firstPlayerName}, Roll the dice!` });
    setGamePhase('rolling');
    console.log("[App.jsx] Setup complete. Phase: 'rolling'.");
  };

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
          content: question,
          playerName: activePlayer.name
        });
        console.log(`[App.jsx] Displaying question #${qIndexToShow + 1} for ${activePlayer.name}`);
      } else {
        console.error("[App.jsx] No question found at index", qIndexToShow);
        setBoardCenterDisplay({ type: 'placeholder', content: "Error loading question.", playerName: activePlayer.name });
      }
    }
    // This useEffect does not clear boardCenterDisplay if not 'questioning',
    // allowing consequence to persist. Clearing happens in handleRollDice.
  }, [gamePhase, activePlayerId, eslQuestions, questionIndex, players]);


  const handleRollDice = useCallback(() => {
    if (gamePhase !== 'rolling') return;
    const activePlayer = players.find(p => p.id === activePlayerId);
    console.log(`[App.jsx] ${activePlayer?.name || `Team ${activePlayerId}`} rolling dice.`);
    
    setBoardCenterDisplay({ type: 'placeholder', content: `Rolling for ${activePlayer?.name}...` });
    
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
      setGamePhase('questioning');
    }, 700);
  }, [activePlayerId, gamePhase, players]);


  const handleAnswerSelect = (selectedOption) => {
    if (gamePhase !== 'questioning' || !selectedOption || !boardCenterDisplay || boardCenterDisplay.type !== 'question') return;

    const playerNameWhoAnswered = boardCenterDisplay.playerName;
    console.log(`[App.jsx] ${playerNameWhoAnswered} selected: "${selectedOption.optionText}".`);
    
    setBoardCenterDisplay({
        type: 'consequence',
        content: {
            consequenceText: selectedOption.consequenceText,
            move: selectedOption.move
        },
        forPlayerName: playerNameWhoAnswered
    });
    setGamePhase('consequenceMoving');

    setTimeout(() => {
      console.log(`[App.jsx] Applying consequence move: ${selectedOption.move} for ${playerNameWhoAnswered}.`);
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

      const nextPlayerId = activePlayerId === 1 ? 2 : 1;
      const nextPlayer = players.find(p => p.id === nextPlayerId);
      setActivePlayerId(nextPlayerId);
      setCurrentDiceRollValue(null);
      setQuestionIndex(prev => prev + 1);
      // `boardCenterDisplay` (showing consequence) is NOT cleared here.
      // It gets cleared by the next player's `handleRollDice`.
      setGamePhase('rolling');
      console.log(`[App.jsx] Turn ended for ${playerNameWhoAnswered}. Next player: ${nextPlayer?.name}. Phase: 'rolling'. Previous consequence remains.`);
    }, CONSEQUENCE_MOVE_ANIMATION_DURATION); // Use this constant
  };


  if (gamePhase === 'setup') {
    return <GameSetup onQuestionsAndSettingsReady={handleQuestionsAndSettingsReady} />;
  }

  const activePlayerForControls = players.find(p => p.id === activePlayerId);
  
  // Determine playerName for boardCenterContent.
  // If showing consequence, it's for the player who just answered (which is still activePlayerId at that point).
  // If showing question, it's for the current activePlayerId.
  // If placeholder, it's for the current activePlayerId.
  const playerNameForBoardCenter = boardCenterDisplay?.playerName || activePlayerForControls?.name || '';


  return (
    <div className="esl-game-app-layout">
      <div className="top-player-stats-panel">
        {players.map(player => (
          <Player
            key={player.id}
            teamName={player.name}
            color={player.color}
            isActive={player.id === activePlayerId && 
                        (gamePhase === 'rolling' || gamePhase === 'questioning' || gamePhase === 'diceMoving' || gamePhase === 'consequenceMoving')}
                        // Player remains "active" visually through most of their turn phases
          />
        ))}
      </div>

      <div className="board-wrapper-main">
        <Board
          players={players}
          config={BOARD_CONFIG}
          boardCenterContent={boardCenterDisplay}
          onAnswerSelect={handleAnswerSelect}
          disableOptions={gamePhase !== 'questioning'} // Options only enabled during 'questioning'
          activePlayerId={activePlayerId} // Pass for token glow
          gamePhaseForGlow={gamePhase}   // Pass for token glow
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