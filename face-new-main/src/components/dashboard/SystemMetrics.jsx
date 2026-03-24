import React, { useEffect, useState } from 'react';

const SystemMetrics = ({ metrics = {} }) => {
  const [cpuUsage, setCpuUsage] = useState(metrics.cpuUsage || 37);
  const [ramUsage, setRamUsage] = useState(metrics.ramUsage || 59);

  // Simulate system metrics updates if not provided
  useEffect(() => {
    const interval = setInterval(() => {
      if (!metrics.cpuUsage) {
        setCpuUsage(Math.random() * 60 + 20);
      }
      if (!metrics.ramUsage) {
        setRamUsage(Math.random() * 40 + 40);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics.cpuUsage, metrics.ramUsage]);

  // Use provided metrics or defaults
  const displayMetrics = [
    { label: 'CPU', value: metrics.cpuUsage || cpuUsage, unit: '%', max: 100 },
    { label: 'RAM', value: metrics.ramUsage || ramUsage, unit: '%', max: 100 },
    { label: 'INFERENCE', value: metrics.processingTime || 0, unit: 'ms', max: 50 },
    { label: 'DETECTIONS', value: metrics.detectionCount || 0, unit: '', max: 100 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {displayMetrics.map((metric, idx) => {
        const percentage = Math.min(100, (metric.value / metric.max) * 100);

        return (
          <div
            key={idx}
            className="glass-card p-4 border-secondary/20 relative overflow-hidden"
          >
            {/* Background bar */}
            <div
              className="absolute top-0 left-0 h-full bg-primary/10 transition-all"
              style={{ width: `${percentage}%` }}
            ></div>

            {/* Content */}
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest text-textSecondary/70 uppercase">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">
                {metric.value.toFixed(0)}
                <span className="text-xs ml-1">{metric.unit}</span>
              </p>
              <p className="text-[10px] text-textSecondary mt-1">
                {metric.label === 'DETECTIONS' ? 'Today' : 'Usage'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SystemMetrics;
