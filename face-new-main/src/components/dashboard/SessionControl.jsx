import React, { useEffect, useState } from 'react';
import { Play, Pause, StopCircle } from 'lucide-react';

const SessionControl = ({ isActive, onStart, onPause, onEnd, duration = 0 }) => {
  const [displayDuration, setDisplayDuration] = useState('00:00:00');

  useEffect(() => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    setDisplayDuration(
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    );
  }, [duration]);

  return (
    <div className="glass-card p-6 border-secondary/20">
      <h3 className="text-xs font-bold tracking-widest text-secondary uppercase mb-6">
        Session Control
      </h3>

      {/* Subject/Class Selector */}
      <div className="mb-6">
        <label className="text-xs font-bold text-textSecondary uppercase mb-2 block">
          Subject / Class
        </label>
        <select
          className="w-full px-3 py-2 bg-background/50 border border-primary/30 rounded text-xs text-textPrimary focus:outline-none focus:border-primary/60 transition-all"
          defaultValue="Computer Vision (CS401)"
        >
          <option>Computer Vision (CS401)</option>
          <option>Database Systems</option>
          <option>Web Development</option>
          <option>AI & ML</option>
        </select>
      </div>

      {/* Duration Display */}
      <div className="text-center mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs font-bold text-textSecondary uppercase mb-2">Session Duration</p>
        <p className="text-4xl font-bold text-primary font-mono tracking-widest">
          {displayDuration}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onStart}
          disabled={isActive}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 border border-primary/50 hover:border-primary text-primary hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-bold text-sm uppercase"
        >
          <Play className="w-4 h-4" />
          Start
        </button>

        <button
          onClick={onPause}
          disabled={!isActive}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-warning/20 border border-warning/50 hover:border-warning text-warning hover:bg-warning/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-bold text-sm uppercase"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>

        <button
          onClick={onEnd}
          disabled={!isActive}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-danger/20 border border-danger/50 hover:border-danger text-danger hover:bg-danger/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-bold text-sm uppercase"
        >
          <StopCircle className="w-4 h-4" />
          End
        </button>
      </div>
    </div>
  );
};

export default SessionControl;
