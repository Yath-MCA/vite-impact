import { memo, useMemo } from 'react';

const COLORS = ['#ff8635', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function PieChart({ data = [] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0) || 1, [data]);

  let start = 0;
  const slices = data.map((item, index) => {
    const ratio = item.value / total;
    const end = start + ratio;
    const largeArcFlag = ratio > 0.5 ? 1 : 0;
    const x1 = Math.cos(2 * Math.PI * start - Math.PI / 2) * 45;
    const y1 = Math.sin(2 * Math.PI * start - Math.PI / 2) * 45;
    const x2 = Math.cos(2 * Math.PI * end - Math.PI / 2) * 45;
    const y2 = Math.sin(2 * Math.PI * end - Math.PI / 2) * 45;
    const path = `M 0 0 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    start = end;
    return { path, color: COLORS[index % COLORS.length], label: item.label, value: item.value };
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-4">
        <svg viewBox="-50 -50 100 100" className="h-44 w-44">
          {slices.map((slice) => (
            <path key={`${slice.label}-${slice.value}`} d={slice.path} fill={slice.color} />
          ))}
        </svg>
        <ul className="space-y-1 text-xs text-gray-600">
          {slices.map((slice) => (
            <li key={`legend-${slice.label}`} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.label}</span>
              <span className="font-semibold">{slice.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default memo(PieChart);
