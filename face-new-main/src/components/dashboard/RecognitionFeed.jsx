import React, { useState, useEffect } from 'react';
import { getAttendance } from '../../api';

const RecognitionFeed = ({ latestFace = null }) => {
  const [recognitionHistory, setRecognitionHistory] = useState([]);

  useEffect(() => {
    if (latestFace && latestFace.name && latestFace.name !== 'UNKNOWN') {
      setRecognitionHistory(prev => {
        const newHistory = [{
          id: Date.now(),
          name: latestFace.name,
          confidence: latestFace.confidence,
          timestamp: new Date().toLocaleTimeString(),
          status: latestFace.status
        }, ...prev];
        return newHistory.slice(0, 5); // Keep last 5
      });
    }
  }, [latestFace]);

  return (
    <div className="glass-card p-6 border-secondary/20 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest text-secondary uppercase">
          RECOGNITION FEED
        </h3>
        <span className="text-xs font-bold text-primary">● LIVE</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {recognitionHistory.length === 0 ? (
          <p className="text-xs text-textSecondary text-center py-8">
            Awaiting face recognition...
          </p>
        ) : (
          recognitionHistory.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">
                    {record.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-textPrimary">
                    {record.name}
                  </p>
                  <p className="text-[10px] text-textSecondary">
                    {record.confidence}% confidence
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-textSecondary">
                  {record.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecognitionFeed;
