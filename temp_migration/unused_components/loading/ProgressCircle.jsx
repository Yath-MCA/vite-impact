import React, { useEffect, useState } from 'react';
import './ProgressCircle.css';

const ProgressCircle = ({ value = 0, max = 10, status = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const targetValue = Math.min(Math.max(value, 0), max);
    const duration = 300;
    const startValue = displayValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;

      setDisplayValue(Math.round(currentValue * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, max]);

  const percentage = (displayValue / max) * 100;
  const rotation = (percentage / 100) * 360;

  const getColor = () => {
    if (percentage >= 100) return '#72C245';
    if (percentage >= 70) return '#4CAF50';
    if (percentage >= 40) return '#FF8E33';
    return '#2196F3';
  };

  const progressColor = getColor();
  const backgroundColor = '#F0F0F0';

  return (
    <div className="progress-circle-container">
      <div
        className="progress-circle"
        style={{
          background: `conic-gradient(${progressColor} ${rotation}deg, ${backgroundColor} ${rotation}deg)`
        }}
      >
        <div className="progress-circle-inner">
          <span className="progress-value">{Math.round(percentage)}%</span>
        </div>
      </div>
      {status && (
        <div className="progress-status">{status}</div>
      )}
    </div>
  );
};

export default ProgressCircle;
