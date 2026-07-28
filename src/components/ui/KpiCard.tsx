import type { KpiValue } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const statusConfig = {
  good: { color: '#00B86B', bg: '#e6f9f0', text: 'ممتاز' },
  warning: { color: '#F59E0B', bg: '#fffbeb', text: 'تحذير' },
  critical: { color: '#ef4444', bg: '#fef2f2', text: 'حرج' },
};

interface KpiCardProps {
  kpi: KpiValue;
  icon: React.ReactNode;
}

export default function KpiCard({ kpi, icon }: KpiCardProps) {
  const config = statusConfig[kpi.status];
  const trendPositive = kpi.trend > 0;
  const trendNegative = kpi.trend < 0;
  const isInverse = kpi.key === 'downtime' || kpi.key === 'waste' || kpi.key === 'energy';

  const trendGood = isInverse ? trendNegative : trendPositive;

  return (
    <div className="card card-hover p-5 animate-fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15`, color: config.color }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{kpi.label}</p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              {config.text}
            </span>
          </div>
        </div>
        {trendPositive ? (
          <TrendingUp size={18} className={trendGood ? 'text-success' : 'text-warning'} />
        ) : trendNegative ? (
          <TrendingDown size={18} className={trendGood ? 'text-success' : 'text-red-500'} />
        ) : (
          <Minus size={18} className="text-slate-400" />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
          {kpi.value.toLocaleString('en-US')}
        </span>
        <span className="text-sm font-medium text-slate-400">{kpi.unit}</span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">{kpi.description}</span>
        <span
          className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
            trendGood ? 'text-success bg-success/10' : 'text-red-500 bg-red-50'
          }`}
        >
          {trendPositive ? '+' : ''}{kpi.trend}{kpi.unit}
        </span>
      </div>
    </div>
  );
}
