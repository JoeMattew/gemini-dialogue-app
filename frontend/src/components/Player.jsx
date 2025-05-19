// frontend/src/components/Player.jsx
import React from 'react';
import './Player.css';

const Player = ({ teamName, color, isActive }) => {
  const activeStyle = isActive 
    ? { 
        borderColor: color, 
        '--active-glow-color': color // Set CSS variable for glow
      } 
    : { 
        borderColor: 'var(--border-color-light)' 
      };

  return (
    <div 
      className={`player-stats-window ${isActive ? 'active' : ''}`} 
      style={activeStyle}
    >
      <h3>{teamName}</h3>
    </div>
  );
};

export default Player;