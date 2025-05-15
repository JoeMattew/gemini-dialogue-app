// frontend/src/components/GameSetup.jsx - TEMPORARY MINIMAL VERSION FOR DEPLOYED TEST
import React from 'react';
// import './GameSetup.css'; // Comment out CSS to rule it out

const GameSetup = ({ onQuestionsAndSettingsReady }) => {
  console.log("[GameSetup.jsx] Minimal component rendering!");
  alert("[GameSetup.jsx] Minimal component rendering!"); // Very aggressive

  const handleTestSubmit = () => {
    alert("[GameSetup.jsx] Test submit clicked. Calling onQuestionsAndSettingsReady.");
    onQuestionsAndSettingsReady( // Simulate successful data
      [{ text: "Test Q1" }, { text: "Test Q2" }],
      { topic: "Test", level: "A1", structure: "Test" }
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,255,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '30px', border: '2px solid black' }}>
        <h2>MINIMAL GAME SETUP</h2>
        <p>If you see this, GameSetup is rendering.</p>
        <button onClick={handleTestSubmit}>Test Setup Complete</button>
      </div>
    </div>
  );
};
export default GameSetup;