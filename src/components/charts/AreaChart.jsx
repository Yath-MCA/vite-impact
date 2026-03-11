import { memo, useMemo } from 'react';

function AreaChart({ data = [], height = 180, color = '#ff8635' }) {
  const points = useMemo(() => {
    if (!data.length) return { line: '', area: '' };
    const max = Math.max(...data.map((d) => d.value), 1);
    const linePoints = data.map((d, index) => {
      const x = (index / Math.max(1, data.length - 1)) * 100;
      const y = 100 - (d.value / max) * 100;
      return `${x},${y}`;
    });

    const area = `0,100 ${linePoints.join(' ')} 100,100`;
    return { line: linePoints.join(' '), area };
  }, [data]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height }}>
        <polygon points={points.area} fill={color} opacity="0.2" />
        <polyline points={points.line} fill="none" stroke={color} strokeWidth="2" />
      </svg>
    </div>
  );
}

export default memo(AreaChart);
