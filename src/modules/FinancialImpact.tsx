import { DollarSign, TrendingDown, TrendingUp, ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { generateFinancialImpact, generateBeforeAfterComparison } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';

export default function FinancialImpact() {
  const { bundle } = useFactoryData();
  const items = generateFinancialImpact(bundle ?? undefined);
  const comparison = generateBeforeAfterComparison(bundle ?? undefined);

  const totalCurrent = items.reduce((a, f) => a + f.currentCost, 0);
  const totalSaving = items.reduce((a, f) => a + f.expectedSaving, 0);
  const totalAnnual = items.reduce((a, f) => a + f.annualSaving, 0);
  const reductionPct = ((totalSaving / totalCurrent) * 100).toFixed(0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-success to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Calculator size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">محرك الأثر المالي</h2>
            <p className="text-sm text-white/60 mt-0.5">Financial Impact Engine - تحليل التكاليف والتوفير المتوقع</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-500" />
            <p className="text-xs text-slate-400">التكلفة الحالية</p>
          </div>
          <p className="text-2xl font-extrabold text-red-500 tabular-nums">{totalCurrent.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي / شهر</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-success" />
            <p className="text-xs text-slate-400">التوفير المتوقع</p>
          </div>
          <p className="text-2xl font-extrabold text-success tabular-nums">{totalSaving.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي / شهر</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-aiblue-600" />
            <p className="text-xs text-slate-400">التوفير السنوي</p>
          </div>
          <p className="text-2xl font-extrabold text-aiblue-600 tabular-nums">{totalAnnual.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي / سنة</p>
        </div>
        <div className="card p-5 bg-gradient-to-l from-success/5 to-white border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-success" />
            <p className="text-xs text-slate-400">نسبة التقليل</p>
          </div>
          <p className="text-2xl font-extrabold text-success tabular-nums">{reductionPct}%</p>
          <p className="text-xs text-slate-400">من إجمالي التكاليف</p>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="card p-6">
        <h3 className="section-title mb-4">تحليل التكاليف التفصيلي</h3>
        <div className="space-y-4">
          {items.map((item) => {
            const pct = (item.expectedSaving / item.currentCost) * 100;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                      <TrendingDown size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.categoryAr}</p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400">التوفير الشهري</p>
                    <p className="text-lg font-extrabold text-success tabular-nums">{item.expectedSaving.toLocaleString('en-US')} ر.ي</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-red-50 p-2">
                    <p className="text-[10px] text-slate-400">الحالي</p>
                    <p className="text-sm font-bold text-red-500 tabular-nums">{item.currentCost.toLocaleString('en-US')}</p>
                  </div>
                  <div className="rounded-lg bg-warning/10 p-2">
                    <p className="text-[10px] text-slate-400">التحسين</p>
                    <p className="text-sm font-bold text-warning tabular-nums">-{item.expectedImprovement}%</p>
                  </div>
                  <div className="rounded-lg bg-success/10 p-2">
                    <p className="text-[10px] text-slate-400">السنوي</p>
                    <p className="text-sm font-bold text-success tabular-nums">{item.annualSaving.toLocaleString('en-US')}</p>
                  </div>
                </div>
                <div className="mt-3 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-l from-red-400 to-success transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Before / After comparison */}
      <div className="card p-6">
        <h3 className="section-title mb-1">مقارنة قبل وبعد التحسين</h3>
        <p className="text-xs text-slate-400 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-aiblue-50 text-aiblue-600 font-semibold ml-2">تقديري</span>
          Before &amp; After - الأثر المتوقع لتنفيذ جميع التوصيات
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b border-slate-200">
                <th className="pb-3 font-semibold text-slate-500 text-xs">المؤشر</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">قبل MIZAN</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">بعد التحسين</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">التحسن</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">النسبة</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => {
                const isPositive = c.metric === 'Downtime' || c.metric === 'Defect Rate' || c.metric === 'Energy Cost/Unit' || c.metric === 'Waste Cost'
                  ? c.after < c.before
                  : c.after > c.before;
                const changePct = ((c.after - c.before) / c.before) * 100;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">{c.metricAr}</td>
                    <td className="py-3 text-slate-500 tabular-nums">{c.before.toLocaleString('en-US')} {c.unit}</td>
                    <td className="py-3 text-slate-700 font-bold tabular-nums">{c.after.toLocaleString('en-US')} {c.unit}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-success' : 'text-red-500'}`}>
                        {isPositive ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                        {Math.abs(c.improvement).toLocaleString('en-US')} {c.unit}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-bold tabular-nums ${isPositive ? 'text-success' : 'text-red-500'}`}>
                        {changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI summary */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-aiblue-800 text-white border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-white/50 mb-1">الاستثمار المتوقع</p>
            <p className="text-2xl font-extrabold tabular-nums">{(totalCurrent * 0.3).toLocaleString('en-US')}</p>
            <p className="text-xs text-white/40">ر.ي (تكلفة التنفيذ)</p>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1">العائد الشهري</p>
            <p className="text-2xl font-extrabold text-success tabular-nums">{totalSaving.toLocaleString('en-US')}</p>
            <p className="text-xs text-white/40">ر.ي / شهر</p>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1">فترة الاسترداد</p>
            <p className="text-2xl font-extrabold text-aiblue-300 tabular-nums">{Math.ceil((totalCurrent * 0.3) / totalSaving)} شهر</p>
            <p className="text-xs text-white/40">Payback Period</p>
          </div>
        </div>
      </div>
    </div>
  );
}
