// frontend/src/components/Square.jsx
import React from 'react';
import './Square.css';

const Square = ({ id, style, type, children }) => {
  // `children` will be player tokens
  return (
    <div className={`game-square ${type || ''}`} style={style}>
      <div className="square-id-display">{id}</div>
      <div className="player-tokens-on-square">
        {children}
      </div>
    </div>
  );
};

export default Square;