import React from 'react';
import './Player.css';

const Player = ({ teamName, color, isActive }) => {
  return (
    <div className={`player-stats-window ${isActive ? 'active' : ''}`} style={{ borderColor: isActive ? color : 'var(--border-color-light)' }}>
      <h3>{teamName}</h3>
      {/* Future: Add score or simple indicators here */}
    </div>
  );
};

export default Player;