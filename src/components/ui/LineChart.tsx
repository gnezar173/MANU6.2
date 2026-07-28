interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  target?: number;
  unit?: string;
}

export default function LineChart({
  data,
  labels,
  height = 200,
  color = '#0066FF',
  target,
  unit = '',
}: LineChartProps) {
  const width = 600;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(...data, target ?? 0) * 1.15;
  const min = Math.min(...data, target ?? max) * 0.85;

  const xStep = chartW / (data.length - 1);
  const points = data.map((v, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - ((v - min) / (max - min)) * chartH;
    return { x, y, value: v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`area-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + chartH * t;
        const val = max - (max - min) * t;
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 tabular-nums">
              {Math.round(val)}{unit}
            </text>
          </g>
        );
      })}
      {target && (
        <line
          x1={padding.left}
          y1={padding.top + chartH - ((target - min) / (max - min)) * chartH}
          x2={width - padding.right}
          y2={padding.top + chartH - ((target - min) / (max - min)) * chartH}
          stroke="#00B86B"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.5"
        />
      )}
      <path d={areaD} fill={`url(#area-grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] fill-slate-600 font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
            {p.value}{unit}
          </text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={padding.left + i * xStep} y={height - 8} textAnchor="middle" className="text-[10px] fill-slate-400">
          {l}
        </text>
      ))}
    </svg>
  );
}
