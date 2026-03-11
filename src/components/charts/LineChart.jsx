import { memo, useMemo } from 'react';

function LineChart({ data = [], height = 180, color = '#ff8635' }) {
  const points = useMemo(() => {
    if (!data.length) return '';
    const max = Math.max(...data.map((d) => d.value), 1);
    return data
      .map((d, index) => {
        const x = (index / Math.max(1, data.length - 1)) * 100;
        const y = 100 - (d.value / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height }}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    </div>
  );
}

export default memo(LineChart);
