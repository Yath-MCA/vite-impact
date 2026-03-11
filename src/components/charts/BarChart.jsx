import { memo, useMemo } from 'react';

function BarChart({ data = [], height = 180, color = '#ff8635' }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex h-[180px] items-end gap-2" style={{ height }}>
        {data.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex-1">
            <div
              className="rounded-t"
              style={{
                backgroundColor: color,
                height: `${(item.value / max) * 100}%`
              }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(BarChart);
