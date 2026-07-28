import { TrendingUp, TrendingDown, DollarSign, Gauge, Target, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { generateImpactScore } from '@/lib/saas-intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import ScoreGauge from '@/components/ui/ScoreGauge';

export default function ImpactScore() {
  const { bundle } = useFactoryData();
  const impact = generateImpactScore(bundle ?? undefined);

  const metrics = [
    { label: 'OEE', before: impact.beforeMizan.oee, after: impact.afterImprovement.oee, unit: '%', improvement: impact.oeeImprovement, isHigher: true },
    { label: 'معدل العيوب', before: impact.beforeMizan.defectRate, after: impact.afterImprovement.defectRate, unit: '%', improvement: -3.7, isHigher: false },
    { label: 'نسبة التوقفات', before: impact.beforeMizan.downtimePct, after: impact.afterImprovement.downtimePct, unit: '%', improvement: -8, isHigher: false },
    { label: 'تكلفة الهدر', before: impact.beforeMizan.wasteCost / 1000000, after: impact.afterImprovement.wasteCost / 1000000, unit: 'M ر.ي', improvement: -40, isHigher: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-success to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Award size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">مؤشر أثر MIZAN</h2>
            <p className="text-sm text-white/60 mt-0.5">MIZAN Impact Score - قياس القيمة التي يولدها MIZAN AI لمصنعك</p>
          </div>
        </div>
      </div>

      {/* Impact score + savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-4">مؤشر الأثر</h3>
          <div className="flex items-center justify-center py-2">
            <ScoreGauge value={impact.score} label="نسبة الأثر" />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            MIZAN AI يوفر {impact.score}% من الخسائر السنوية
          </p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="section-title mb-4">الملخص المالي</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={18} className="text-red-500" />
                <p className="text-xs text-slate-400">قبل MIZAN</p>
              </div>
              <p className="text-2xl font-extrabold text-red-500 tabular-nums">{(impact.beforeMizan.annualLosses / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-slate-400">ر.ي خسائر سنوية</p>
            </div>
            <div className="rounded-xl bg-success/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-success" />
                <p className="text-xs text-slate-400">بعد التحسين</p>
              </div>
              <p className="text-2xl font-extrabold text-success tabular-nums">{(impact.afterImprovement.savings / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-slate-400">ر.ي توفير سنوي</p>
            </div>
            <div className="rounded-xl bg-aiblue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-aiblue-600" />
                <p className="text-xs text-slate-400">صافي الأثر</p>
              </div>
              <p className="text-2xl font-extrabold text-aiblue-600 tabular-nums">{impact.score}%</p>
              <p className="text-xs text-slate-400">من الخسائر مسترجعة</p>
            </div>
          </div>
          <div className="rounded-xl bg-navy-900 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">إجمالي التوفير المتوقع</p>
                <p className="text-xl font-extrabold text-success tabular-nums">{(impact.afterImprovement.savings / 12).toLocaleString('en-US')} ر.ي/شهر</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-white/50">مشاريع التحسين</p>
                <p className="text-xl font-extrabold tabular-nums">{impact.completedImprovements}/{impact.totalImprovements} مكتمل</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Before / After comparison */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={20} className="text-aiblue-600" />
          <h3 className="section-title">مقارنة قبل وبعد MIZAN</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => {
            const isPositive = metric.isHigher ? metric.after > metric.before : metric.after < metric.before;
            return (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3">{metric.label}</p>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 mb-0.5">قبل</p>
                    <p className="text-lg font-bold text-slate-500 tabular-nums">{metric.before}{metric.unit}</p>
                  </div>
                  <ArrowLeft size={16} className={isPositive ? 'text-success' : 'text-red-500'} />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 mb-0.5">بعد</p>
                    <p className={`text-lg font-bold tabular-nums ${isPositive ? 'text-success' : 'text-red-500'}`}>{metric.after}{metric.unit}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className={`text-xs font-bold tabular-nums ${isPositive ? 'text-success' : 'text-red-500'}`}>
                    {metric.improvement > 0 ? '+' : ''}{metric.improvement}{metric.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Improvement tracking */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-aiblue-600" />
          <h3 className="section-title">تتبع التحسينات</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'مشاريع مكتملة', value: impact.completedImprovements, total: impact.totalImprovements, color: '#00B86B' },
            { label: 'تحسين OEE', value: `+${impact.oeeImprovement.toFixed(0)}%`, color: '#0066FF' },
            { label: 'تقليل الهدر', value: `${impact.wasteReduction.toFixed(0)}%`, color: '#00B86B' },
            { label: 'مؤشر الأثر', value: `${impact.score}%`, color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{item.label}</p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: item.color }}>
                {item.value}
              </p>
              {item.total && <p className="text-[10px] text-slate-400">من {item.total}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
