import { Sparkles, AlertCircle, TrendingUp, DollarSign, Target, ArrowLeft, Crown } from 'lucide-react';
import { generateExecutiveInsight } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import ScoreGauge from '@/components/ui/ScoreGauge';

export default function ExecutiveInsight({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { bundle } = useFactoryData();
  const insight = generateExecutiveInsight(bundle ?? undefined);

  const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    critical: { color: '#ef4444', bg: '#fef2f2', label: 'عاجلة' },
    high: { color: '#F59E0B', bg: '#fffbeb', label: 'عالية' },
    medium: { color: '#0066FF', bg: '#eef4ff', label: 'متوسطة' },
    low: { color: '#64748b', bg: '#f1f5f9', label: 'منخفضة' },
  };

  const effortConfig: Record<string, string> = {
    low: 'جهد منخفض',
    medium: 'جهد متوسط',
    high: 'جهد عالي',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 via-navy-800 to-aiblue-800 text-white border-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-aiblue-500/10 rounded-full blur-3xl -translate-x-20 -translate-y-20" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Crown size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">ملخص الإدارة</h2>
            <p className="text-sm text-white/60 mt-0.5">Executive Insight - ملخص تنفيذي ذكي لأصحاب المصانع</p>
          </div>
        </div>
      </div>

      {/* Top row: Score + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-4">مؤشر صحة المصنع</h3>
          <div className="flex items-center justify-center py-2">
            <ScoreGauge value={insight.factoryHealthScore} label="المؤشر الحالي" />
          </div>
          <div className={`text-center text-sm font-bold mt-2 ${insight.healthTrend > 0 ? 'text-success' : 'text-red-500'}`}>
            {insight.healthTrend > 0 ? `▲ +${insight.healthTrend} نقطة` : `▼ ${insight.healthTrend} نقطة`}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2 bg-gradient-to-l from-success/5 to-white border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={20} className="text-success" />
            <h3 className="section-title">الملخص المالي</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <p className="text-xs text-slate-400 mb-1">الخسائر الشهرية</p>
              <p className="text-2xl font-extrabold text-red-500 tabular-nums">{insight.financialSummary.monthlyLoss.toLocaleString('en-US')}</p>
              <p className="text-xs text-slate-400">ر.ي / شهر</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <p className="text-xs text-slate-400 mb-1">التوفير المتوقع</p>
              <p className="text-2xl font-extrabold text-success tabular-nums">{insight.financialSummary.potentialSaving.toLocaleString('en-US')}</p>
              <p className="text-xs text-slate-400">ر.ي / شهر</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <p className="text-xs text-slate-400 mb-1">العائد على الاستثمار</p>
              <p className="text-2xl font-extrabold text-aiblue-600 tabular-nums">{insight.financialSummary.roi}%</p>
              <p className="text-xs text-slate-400">ROI</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-success/10">
            <p className="text-sm text-success font-semibold">
              بإجراء التحسينات المقترحة، يمكن توفير {insight.totalExpectedSavings.toLocaleString('en-US')} ر.ي شهرياً ({(insight.totalExpectedSavings * 12).toLocaleString('en-US')} ر.ي سنوياً)
            </p>
          </div>
        </div>
      </div>

      {/* Top Problems + Top Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-red-500" />
            <h3 className="section-title">أهم المشاكل</h3>
          </div>
          <div className="space-y-3">
            {insight.topProblems.map((problem, i) => {
              const config = priorityConfig[problem.severity];
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200">
                  <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 font-bold text-sm flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800">{problem.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{problem.impact}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-success" />
            <h3 className="section-title">أهم فرص التحسين</h3>
          </div>
          <div className="space-y-3">
            {insight.topOpportunities.map((opp, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200">
                <span className="w-7 h-7 rounded-full bg-success/10 text-success font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 mb-1">{opp.title}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-success tabular-nums">{opp.saving.toLocaleString('en-US')} ر.ي/شهر</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{effortConfig[opp.effort]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Decisions */}
      <div className="card p-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white border-0">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-aiblue-300" />
          <h3 className="text-base font-bold">قرارات الأسبوع الموصى بها</h3>
        </div>
        <div className="space-y-3">
          {insight.weeklyDecisions.map((decision, i) => {
            const config = priorityConfig[decision.priority];
            return (
              <div key={i} className="rounded-xl bg-white/10 p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold">{decision.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.color + '30', color: config.color === '#ef4444' ? '#fca5a5' : config.color === '#F59E0B' ? '#fcd34d' : '#93c5fd' }}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">{decision.expectedResult}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-aiblue-300" />
            <span className="text-sm text-white/70">التوفير المتوقع من قرارات الأسبوع: {insight.totalExpectedSavings.toLocaleString('en-US')} ر.ي/شهر</span>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-aiblue-300 hover:text-aiblue-200 transition-colors"
          >
            عرض مشاريع التحسين
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
