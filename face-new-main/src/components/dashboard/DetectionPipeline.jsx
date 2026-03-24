import React from 'react';
import { CheckCircle } from 'lucide-react';

const DetectionPipeline = ({ pipeline }) => {
  const steps = [
    { label: 'Frame Captured', count: pipeline?.framesCaptured || 0, active: true },
    { label: 'Face Detected (NMS)', count: pipeline?.facesDetected || 0, active: pipeline?.facesDetected > 0 },
    { label: 'Encoding Extracted (128-d)', count: pipeline?.encodingsExtracted || 0, active: pipeline?.encodingsExtracted > 0 },
    { label: 'Database Match', count: pipeline?.databaseMatches || 0, active: pipeline?.databaseMatches > 0 },
    { label: 'Attendance Marked ✓', count: pipeline?.attendanceMarked || 0, active: pipeline?.attendanceMarked > 0 },
  ];

  return (
    <div className="glass-card p-6 border-secondary/20">
      <h3 className="text-xs font-bold tracking-widest text-secondary uppercase mb-6">
        Detection Pipeline
      </h3>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  step.active
                    ? 'border-primary bg-primary/10 shadow-glow-primary'
                    : 'border-textSecondary/20 bg-transparent'
                }`}
              >
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-12 left-1/2 w-0.5 h-8 transform -translate-x-1/2 ${
                    step.active ? 'bg-primary' : 'bg-textSecondary/20'
                  }`}
                ></div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold text-textPrimary">{step.label}</p>
              <p className="text-[10px] text-secondary font-mono">{step.count} today</p>
            </div>

            {step.active && (
              <CheckCircle className="w-4 h-4 text-primary animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetectionPipeline;
