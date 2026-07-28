import { Grid3x3, AlertCircle, TrendingUp, DollarSign, Cog, Clock } from 'lucide-react';
import { generatePriorityMatrix, priorityConfig, urgencyConfig } from '@/lib/saas-intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import type { PriorityLevel } from '@/types';

export default function PriorityMatrix() {
  const { bundle } = useFactoryData();
  const items = generatePriorityMatrix(bundle ?? undefined);

  const quadrants = [
    { title: 'حرج - فوري', priority: 'critical' as PriorityLevel, desc: 'أثر عالي + إلحاح فوري', color: '#ef4444' },
    { title: 'عالي - قصير المدى', priority: 'high' as PriorityLevel, desc: 'أثر عالي + تنفيذ خلال 30 يوم', color: '#F59E0B' },
    { title: 'متوسط - متوسط المدى', priority: 'medium' as PriorityLevel, desc: 'أثر متوسط + تخطيط', color: '#0066FF' },
    { title: 'منخفض - طويل المدى', priority: 'low' as PriorityLevel, desc: 'أثر منخفض + تحسين مستمر', color: '#64748b' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Grid3x3 size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">مصفوفة أولويات التحسين</h2>
            <p className="text-sm text-white/60 mt-0.5">تصنيف المشاكل حسب الأثر المالي والإنتاجي والإلحاح</p>
          </div>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quadrants.map((q) => {
          const quadrantItems = items.filter((item) => item.priority === q.priority);
          return (
            <div key={q.priority} className="rounded-2xl border-2 p-4" style={{ borderColor: `${q.color}30` }}>
              <div className="mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-bold mb-2" style={{ backgroundColor: q.color }}>
                  {q.title}
                </div>
                <p className="text-[10px] text-slate-400">{q.desc}</p>
              </div>
              <div className="space-y-2">
                {quadrantItems.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center py-4">لا توجد عناصر</p>
                ) : (
                  quadrantItems.map((item) => (
                    <div key={item.id} className="rounded-xl bg-white border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-800 leading-tight mb-2">{item.problem}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {item.affectedArea}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed table */}
      <div className="card p-6">
        <h3 className="section-title mb-4">التصنيف التفصيلي</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b border-slate-200">
                <th className="pb-3 font-semibold text-slate-500 text-xs">المشكلة</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">الأثر المالي</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">أثر الإنتاج</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">الإلحاح</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">صعوبة التنفيذ</th>
                <th className="pb-3 font-semibold text-slate-500 text-xs">الأولوية</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const pConfig = priorityConfig[item.priority];
                const uConfig = urgencyConfig[item.urgency];
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 max-w-xs">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{item.problem}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.affectedArea}</p>
                    </td>
                    <td className="py-3">
                      <PriorityBadge level={item.financialImpact} />
                    </td>
                    <td className="py-3">
                      <PriorityBadge level={item.productionImpact} />
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-semibold" style={{ color: uConfig.color }}>{uConfig.label}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-slate-500">
                        {item.implementationDifficulty === 'low' ? 'منخفض' : item.implementationDifficulty === 'medium' ? 'متوسط' : 'عالي'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: pConfig.bg, color: pConfig.color }}>
                        {pConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">الأثر المالي: تأثير المشكلة على التكاليف</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">أثر الإنتاج: تأثير المشكلة على الإنتاجية</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">الإلحاح: سرعة التصرف المطلوب</span>
          </div>
          <div className="flex items-center gap-2">
            <Cog size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500">صعوبة التنفيذ: الجهد المطلوب</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ level }: { level: PriorityLevel }) {
  const config = priorityConfig[level];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
}
