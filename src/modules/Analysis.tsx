import { Brain, AlertCircle, AlertTriangle, Info, Target, TrendingUp, Cog, ShieldCheck, Zap, Trash2, Package, Wrench, Clock } from 'lucide-react';
import { computeFactoryScore, computeKpis, generateFindings } from '@/lib/analysis';
import { generateAIRecommendations, mapAIRecommendations } from '@/lib/intelligence';
import { generateAIEvidence, generateActionTimeline } from '@/lib/saas-intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import type { Recommendation } from '@/types';
import BarChart from '@/components/ui/BarChart';
import LineChart from '@/components/ui/LineChart';
import AIEvidencePanel from '@/components/ui/AIEvidencePanel';

const severityConfig = {
  critical: { color: '#ef4444', bg: '#fef2f2', icon: <AlertCircle size={18} />, label: 'حرج' },
  warning: { color: '#F59E0B', bg: '#fffbeb', icon: <AlertTriangle size={18} />, label: 'تحذير' },
  info: { color: '#0066FF', bg: '#eef4ff', icon: <Info size={18} />, label: 'معلومة' },
};

const categoryIcons: Record<string, React.ReactNode> = {
  maintenance: <Wrench size={18} />,
  quality: <ShieldCheck size={18} />,
  energy: <Zap size={18} />,
  cost: <Trash2 size={18} />,
  production: <Cog size={18} />,
  waste: <Trash2 size={18} />,
  delivery: <Package size={18} />,
};

const priorityConfig = {
  critical: { color: '#ef4444', bg: '#fef2f2', label: 'عاجلة' },
  high: { color: '#F59E0B', bg: '#fffbeb', label: 'عالية' },
  medium: { color: '#0066FF', bg: '#eef4ff', label: 'متوسطة' },
  low: { color: '#64748b', bg: '#f1f5f9', label: 'منخفضة' },
};

export default function Analysis() {
  const { bundle } = useFactoryData();

  const data = bundle
    ? {
        shiftData: bundle.shiftData,
        machines: bundle.machines,
        downtimeEvents: bundle.downtimeEvents,
        defectRecords: bundle.defectRecords,
        products: bundle.products,
      }
    : undefined;

  const score = computeFactoryScore(data);
  const kpis = computeKpis(data);
  const findings = generateFindings();
  const recs: Recommendation[] = mapAIRecommendations(generateAIRecommendations(data));
  const evidence = generateAIEvidence(
    bundle
      ? {
          shiftData: bundle.shiftData,
          machines: bundle.machines,
          downtimeEvents: bundle.downtimeEvents,
          defectRecords: bundle.defectRecords,
          rawMaterials: bundle.rawMaterials,
          energyRecords: bundle.energyRecords,
        }
      : undefined,
  );
  const timelines = recs.map((rec) =>
    generateActionTimeline(
      rec.id,
      bundle
        ? {
            shiftData: bundle.shiftData,
            machines: bundle.machines,
            downtimeEvents: bundle.downtimeEvents,
            defectRecords: bundle.defectRecords,
            rawMaterials: bundle.rawMaterials,
            energyRecords: bundle.energyRecords,
          }
        : undefined,
    ),
  );

  const machines = bundle?.machines ?? [];
  const shiftData = bundle?.shiftData ?? [];
  const defectRecords = bundle?.defectRecords ?? [];
  const downtimeEvents = bundle?.downtimeEvents ?? [];

  const oeeData = machines.map((m) => ({
    label: m.nameAr.split(' ').slice(-1)[0],
    value: m.oee,
    color: m.oee >= 75 ? '#00B86B' : m.oee >= 60 ? '#F59E0B' : '#ef4444',
  }));

  const qualityTrend = shiftData.slice(-14).reduce((acc, s) => {
    const existing = acc.find((a) => a.date === s.date);
    if (existing) {
      existing.good += s.goodUnits;
      existing.defect += s.defectUnits;
    } else {
      acc.push({ date: s.date, good: s.goodUnits, defect: s.defectUnits });
    }
    return acc;
  }, [] as { date: string; good: number; defect: number }[]);

  const qualityRates = qualityTrend.map((d) => (d.good / (d.good + d.defect)) * 100);

  const defectByType = defectRecords.reduce((acc, d) => {
    const existing = acc.find((a) => a.label === d.defectType);
    if (existing) existing.value += d.count;
    else acc.push({ label: d.defectType, value: d.count, color: '#ef4444' });
    return acc;
  }, [] as { label: string; value: number; color?: string }[]);

  const downtimeByCategory = downtimeEvents.reduce((acc, e) => {
    const existing = acc.find((a) => a.label === e.category);
    if (existing) existing.value += e.durationMin;
    else acc.push({
      label: e.category === 'breakdown' ? 'عطل' : e.category === 'planned' ? 'صيانة' : e.category === 'changeover' ? 'تغيير قالب' : e.category === 'material' ? 'نقص مواد' : 'طاقة',
      value: e.durationMin,
      color: e.category === 'breakdown' ? '#ef4444' : e.category === 'planned' ? '#0066FF' : '#F59E0B',
    });
    return acc;
  }, [] as { label: string; value: number; color?: string }[]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI Header */}
      <div className="card p-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white border-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-20 -translate-y-20" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">تحليل MIZAN AI</h2>
            <p className="text-sm text-white/60 mt-0.5">محرك التحليل الصناعي الذكي - تحليل شامل لعمليات المصنع</p>
          </div>
          <div className="mr-auto text-left">
            <p className="text-xs text-white/50">عدد النتائج</p>
            <p className="text-2xl font-extrabold">{findings.length}</p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="card p-6">
        <h3 className="section-title mb-4">تحليل مؤشر صحة المصنع</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'كفاءة الإنتاج', value: score.components.productionEfficiency, target: 95, color: '#0066FF' },
            { label: 'الجودة', value: score.components.quality, target: 98, color: '#00B86B' },
            { label: 'OEE', value: score.components.oee, target: 85, color: '#8b5cf6' },
            { label: 'الصيانة', value: score.components.maintenance, target: 95, color: '#F59E0B' },
            { label: 'الطاقة', value: score.components.energy, target: 90, color: '#06b6d4' },
            { label: 'التكلفة', value: score.components.cost, target: 85, color: '#ef4444' },
            { label: 'التسليم', value: score.components.delivery, target: 90, color: '#6366f1' },
          ].map((c) => (
            <div key={c.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="32" fill="none" stroke={c.color} strokeWidth="6"
                    strokeDasharray={`${(c.value / 100) * 201} 201`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold tabular-nums" style={{ color: c.color }}>{c.value}</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">{c.label}</p>
              <p className="text-[10px] text-slate-400 tabular-nums">المستهدف: {c.target}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Evidence Panel */}
      <AIEvidencePanel evidence={evidence} />

      {/* Findings */}
      <div>
        <h3 className="section-title mb-4">نتائج التحليل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((f) => {
            const config = severityConfig[f.severity];
            return (
              <div key={f.id} className="card card-hover p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: config.bg, color: config.color }}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-800">{f.area}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.finding}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400">{f.metric}</p>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{f.currentValue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">المعيار</p>
                    <p className="text-sm font-bold text-success tabular-nums">{f.benchmark}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">الفجوة</p>
                    <p className="text-sm font-bold text-red-500 tabular-nums">-</p>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-aiblue-50 flex items-start gap-2">
                  <Target size={16} className="text-aiblue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-aiblue-700 font-medium">{f.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-1">OEE لكل معدة</h3>
          <p className="text-xs text-slate-400 mb-4">كفاءة المعدات الكلية</p>
          <BarChart data={oeeData} unit="%" maxValue={100} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-1">معدل الجودة اليومي</h3>
          <p className="text-xs text-slate-400 mb-4">نسبة المنتجات المطابقة</p>
          <LineChart data={qualityRates} labels={qualityTrend.map((d) => d.date.split('-').slice(2).join('/'))} color="#00B86B" target={98} unit="%" />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-1">توزيع العيوب</h3>
          <p className="text-xs text-slate-400 mb-4">حسب نوع العيب</p>
          <BarChart data={defectByType} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-1">تصنيف التوقفات</h3>
          <p className="text-xs text-slate-400 mb-4">حسب السبب (دقيقة)</p>
          <BarChart data={downtimeByCategory} unit=" د" />
        </div>
      </div>

      {/* All Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-aiblue-600" />
          <h3 className="section-title">توصيات التحسين</h3>
        </div>
        <div className="space-y-3">
          {recs.map((rec) => {
            const pConfig = priorityConfig[rec.priority];
            return (
              <div key={rec.id} className="card card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    {categoryIcons[rec.category]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: pConfig.bg, color: pConfig.color }}>
                        {pConfig.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        الجهد: {rec.effort === 'low' ? 'منخفض' : rec.effort === 'medium' ? 'متوسط' : 'عالي'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{rec.description}</p>
                    <div className="flex items-center gap-4 flex-wrap text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">الأثر:</span>
                        <span className="font-bold text-success">{rec.impact}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">المنهجية:</span>
                        <span className="font-semibold text-slate-600">{rec.methodology}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">المنطقة المتأثرة:</span>
                        <span className="font-semibold text-slate-600">{rec.affectedArea}</span>
                      </div>
                    </div>
                    {/* Action Timeline */}
                    {(() => {
                      const timeline = timelines.find((t) => t.recommendationId === rec.id);
                      if (!timeline) return null;
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Clock size={14} className="text-aiblue-600" />
                            <p className="text-[10px] font-bold text-aiblue-600 uppercase tracking-wide">الجدول الزمني للتنفيذ</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {timeline.steps.map((step, i) => (
                              <div key={i} className="rounded-lg bg-slate-50 p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    step.timeframe === 'immediate' ? 'bg-red-100 text-red-600' :
                                    step.timeframe === 'short_term' ? 'bg-warning/10 text-warning' :
                                    'bg-aiblue-50 text-aiblue-600'
                                  }`}>
                                    {step.timeframeAr}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-700">{step.action}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
