interface ScoreGaugeProps {
  value: number;
  size?: number;
  label?: string;
}

export default function ScoreGauge({ value, size = 180, label }: ScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference * 0.75;
  const startAngle = 135;

  const color = value >= 80 ? '#00B86B' : value >= 60 ? '#F59E0B' : '#ef4444';
  const statusText = value >= 80 ? 'ممتاز' : value >= 60 ? 'مقبول' : 'يحتاج تحسين';

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
          <defs>
            <linearGradient id={`gauge-grad-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size * 0.42}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${size / 2} ${size * 0.42})`}
          />
          <circle
            cx={size / 2}
            cy={size * 0.42}
            r={radius}
            fill="none"
            stroke={`url(#gauge-grad-${value})`}
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75 - offset} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${size / 2} ${size * 0.42})`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tabular-nums" style={{ color }}>
            {value}
          </span>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">من 100</span>
        </div>
      </div>
      {label && <span className="text-sm font-bold text-slate-700 mt-1">{label}</span>}
      <span
        className="text-xs font-semibold px-3 py-0.5 rounded-full mt-1"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {statusText}
      </span>
    </div>
  );
}
