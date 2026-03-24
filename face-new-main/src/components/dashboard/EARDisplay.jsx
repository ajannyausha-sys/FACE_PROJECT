import React from 'react';

const EARGauge = ({ name, value, isDrowsy }) => {
  const percentage = Math.min(100, Math.max(0, (value / 0.4) * 100));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={isDrowsy ? '#ff6b6b' : '#00ff88'}
            strokeWidth="3"
            strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${isDrowsy ? 'text-danger' : 'text-primary'}`}>
            {value.toFixed(2)}
          </span>
          <span className="text-xs text-textSecondary">EAR</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold text-textPrimary truncate w-24">{name}</p>
        <p className={`text-[10px] font-bold tracking-widest uppercase ${isDrowsy ? 'text-danger' : 'text-success'}`}>
          {isDrowsy ? 'DROWSY' : 'OPEN'}
        </p>
      </div>
    </div>
  );
};

const EARDisplay = ({ faces }) => {
  if (!faces || faces.length === 0) {
    return (
      <div className="glass-card p-6 border-secondary/20 flex items-center justify-center">
        <p className="text-xs text-textSecondary">No faces detected</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {faces.map((face, idx) => (
        <div key={idx} className="flex-shrink-0">
          <EARGauge
            name={face.name}
            value={face.ear || 0}
            isDrowsy={face.isDrowsy}
          />
        </div>
      ))}
    </div>
  );
};

export default EARDisplay;
