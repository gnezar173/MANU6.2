interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  unit?: string;
  maxValue?: number;
}

export default function BarChart({ data, height = 200, unit = '', maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value)) * 1.1;

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
            <span className="text-xs font-bold text-slate-700 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
              {d.value.toLocaleString('en-US')}{unit}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 relative"
              style={{
                height: Math.max(2, h),
                backgroundColor: d.color || '#0066FF',
              }}
            />
            <span className="text-[10px] text-slate-500 font-medium text-center leading-tight">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
