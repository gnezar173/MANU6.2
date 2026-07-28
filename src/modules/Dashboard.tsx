import { Activity, Gauge, ShieldCheck, AlertTriangle, Trash2, Zap, Wrench, Sparkles, ArrowLeft } from 'lucide-react';
import ScoreGauge from '@/components/ui/ScoreGauge';
import KpiCard from '@/components/ui/KpiCard';
import LineChart from '@/components/ui/LineChart';
import BarChart from '@/components/ui/BarChart';
import { computeKpis, computeFactoryScore } from '@/lib/analysis';
import { generateAIRecommendations, mapAIRecommendations } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import type { Recommendation } from '@/types';

export default function Dashboard({ onNavigate }: { onNavigate: (key: 'analysis' | 'advisor' | 'report') => void }) {
  const { bundle } = useFactoryData();

  const data = bundle
    ? {
        shiftData: bundle.shiftData,
        machines: bundle.machines,
        downtimeEvents: bundle.downtimeEvents,
        productionLines: bundle.productionLines,
        products: bundle.products,
      }
    : undefined;

  const kpis = computeKpis(data);
  const score = computeFactoryScore(data);
  const recs: Recommendation[] = mapAIRecommendations(generateAIRecommendations(data));
  const topRec = recs[0];

  const activeShiftData = bundle?.shiftData ?? [];
  const activeMachines = bundle?.machines ?? [];
  const activeDowntime = bundle?.downtimeEvents ?? [];
  const activeLines = bundle?.productionLines ?? [];

  const dailyProduction = activeShiftData.slice(-14).reduce((acc, s) => {
    const existing = acc.find((a) => a.date === s.date);
    if (existing) existing.value += s.actualUnits;
    else acc.push({ date: s.date, value: s.actualUnits });
    return acc;
  }, [] as { date: string; value: number }[]);

  const lineProduction = activeLines.map((line) => {
    const lineShifts = activeShiftData.slice(-14).filter((s) => s.lineId === line.id);
    return {
      label: line.nameAr.split(' - ')[0],
      value: lineShifts.reduce((sum, s) => sum + s.actualUnits, 0),
      color: line.id === 'line-1' ? '#0066FF' : line.id === 'line-2' ? '#00B86B' : '#F59E0B',
    };
  });

  const downtimeByMachine = activeMachines
    .map((m) => ({
      label: m.nameAr.split(' ').slice(0, 3).join(' '),
      value: activeDowntime.filter((e) => e.machineId === m.id).reduce((sum, e) => sum + e.durationMin, 0),
      color: m.oee < 60 ? '#ef4444' : m.oee < 75 ? '#F59E0B' : '#0066FF',
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const scoreComponents = [
    { label: 'كفاءة الإنتاج', value: score.components.productionEfficiency, color: '#0066FF' },
    { label: 'الجودة', value: score.components.quality, color: '#00B86B' },
    { label: 'OEE', value: score.components.oee, color: '#8b5cf6' },
    { label: 'الصيانة', value: score.components.maintenance, color: '#F59E0B' },
    { label: 'الطاقة', value: score.components.energy, color: '#06b6d4' },
    { label: 'التكلفة', value: score.components.cost, color: '#ef4444' },
    { label: 'التسليم', value: score.components.delivery, color: '#6366f1' },
  ];

  const kpiIcons = [
    <Activity size={20} />,
    <Gauge size={20} />,
    <ShieldCheck size={20} />,
    <AlertTriangle size={20} />,
    <Trash2 size={20} />,
    <Zap size={20} />,
    <Wrench size={20} />,
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">مؤشر صحة المصنع</h3>
              <p className="text-xs text-slate-400 mt-0.5">MIZAN Factory Score</p>
            </div>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                score.trend > 0 ? 'text-success bg-success/10' : 'text-red-500 bg-red-50'
              }`}
            >
              {score.trend > 0 ? '+' : ''}{score.trend} نقطة
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <ScoreGauge value={score.current} label="المؤشر الحالي" />
          </div>
          <div className="grid grid-cols-7 gap-1 mt-4">
            {scoreComponents.map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-1">
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${c.value}%`, backgroundColor: c.color }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 font-medium text-center leading-tight">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="card p-6 lg:col-span-2 bg-gradient-to-l from-navy-900 to-navy-800 text-white border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-aiblue-600/20 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-aiblue-600 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">توصية MIZAN AI</h3>
                <p className="text-[11px] text-white/50">ذكاء اصطناعي صناعي</p>
              </div>
              <span className="mr-auto text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300">
                عاجلة
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-4">
              {topRec.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <p className="text-[11px] text-white/50 mb-1">التوصية</p>
                <p className="text-sm font-semibold">{topRec.title}</p>
              </div>
              <div className="rounded-xl bg-success/10 p-3 border border-success/20">
                <p className="text-[11px] text-success/70 mb-1">الأثر المتوقع</p>
                <p className="text-sm font-semibold text-success">{topRec.impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
              <span className="px-2 py-1 rounded-md bg-white/5">{topRec.methodology}</span>
              <span className="px-2 py-1 rounded-md bg-white/5">{topRec.affectedArea}</span>
            </div>
            <button
              onClick={() => onNavigate('report')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-aiblue-300 hover:text-aiblue-200 transition-colors"
            >
              عرض التقرير الكامل
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <h3 className="section-title mb-4">المؤشرات الرئيسية</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.key} kpi={kpi} icon={kpiIcons[i]} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-1">الإنتاج اليومي</h3>
          <p className="text-xs text-slate-400 mb-4">آخر 14 يوم - عدد الوحدات المنتجة</p>
          <LineChart
            data={dailyProduction.map((d) => d.value)}
            labels={dailyProduction.map((d) => d.date.split('-').slice(2).join('/'))}
            color="#0066FF"
            unit=""
          />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-1">الإنتاج حسب الخط</h3>
          <p className="text-xs text-slate-400 mb-4">إجمالي الوحدات لكل خط إنتاج</p>
          <BarChart data={lineProduction} unit="" />
        </div>
      </div>

      {/* Downtime analysis */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">تحليل التوقفات</h3>
            <p className="text-xs text-slate-400 mt-0.5">التوقفات حسب المعدة (دقيقة)</p>
          </div>
          <button
            onClick={() => onNavigate('analysis')}
            className="text-sm font-semibold text-aiblue-600 hover:text-aiblue-700 transition-colors"
          >
            تحليل تفصيلي
          </button>
        </div>
        {downtimeByMachine.length > 0 ? (
          <BarChart data={downtimeByMachine} unit=" د" />
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">لا توجد توقفات مسجلة</p>
        )}
      </div>
    </div>
  );
}
