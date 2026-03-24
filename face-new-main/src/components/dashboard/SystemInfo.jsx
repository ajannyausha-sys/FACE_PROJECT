import React from 'react';

const SystemInfo = () => {
  const systemInfo = [
    { label: 'Algorithm', value: 'dlib face_recognition' },
    { label: 'Encoder', value: 'ResNet-34 (128-d)' },
    { label: 'Distance', value: 'Euclidean + 0.43' },
    { label: 'Model', value: 'HOG + Linear SVM' },
  ];

  return (
    <div className="glass-card p-6 border-secondary/20">
      <h3 className="text-xs font-bold tracking-widest text-secondary uppercase mb-4">
        System Info
      </h3>

      <div className="space-y-3">
        {systemInfo.map((info, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <p className="text-xs font-bold text-textSecondary/70 uppercase">
              {info.label}
            </p>
            <p className="text-xs font-mono text-primary">
              {info.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemInfo;
