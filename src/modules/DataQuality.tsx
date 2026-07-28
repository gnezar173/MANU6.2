import { Database, AlertCircle, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { generateDataQualityScore } from '@/lib/saas-intelligence';
import ScoreGauge from '@/components/ui/ScoreGauge';

export default function DataQuality() {
  const dq = generateDataQualityScore();

  const categories = [
    { label: 'بيانات الإنتاج', score: dq.production_score, icon: '📊', color: '#0066FF' },
    { label: 'بيانات الصيانة', score: dq.maintenance_score, icon: '🔧', color: '#F59E0B' },
    { label: 'بيانات الجودة', score: dq.quality_score, icon: '✅', color: '#00B86B' },
    { label: 'بيانات الطاقة', score: dq.energy_score, icon: '⚡', color: '#06b6d4' },
    { label: 'بيانات التكاليف', score: dq.cost_score, icon: '💰', color: '#8b5cf6' },
  ];

  const metrics = [
    { label: 'اكتمال البيانات', score: dq.completeness_score, description: 'نسبة البيانات المتوفرة من إجمالي البيانات المطلوبة' },
    { label: 'تواتر التحديث', score: dq.update_frequency_score, description: 'مدى انتظام تحديث البيانات' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">ذكاء جودة البيانات</h2>
            <p className="text-sm text-white/60 mt-0.5">MIZAN Data Quality Score - قياس جودة بيانات المصنع ودقتها</p>
          </div>
        </div>
      </div>

      {/* Overall score + recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-4">نتيجة جودة البيانات</h3>
          <div className="flex items-center justify-center py-2">
            <ScoreGauge value={dq.overall_score} label="النتيجة الإجمالية" />
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-warning" />
            <h3 className="section-title">توصية MIZAN AI</h3>
          </div>
          <div className="rounded-xl bg-warning/10 p-4 mb-4">
            <p className="text-sm text-slate-700 leading-relaxed">{dq.recommendation}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                  <span className={`text-sm font-extrabold tabular-nums ${metric.score >= 90 ? 'text-success' : metric.score >= 75 ? 'text-warning' : 'text-red-500'}`}>
                    {metric.score}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${metric.score}%`,
                      backgroundColor: metric.score >= 90 ? '#00B86B' : metric.score >= 75 ? '#F59E0B' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card p-6">
        <h3 className="section-title mb-4">جودة البيانات حسب المجال</h3>
        <div className="space-y-4">
          {categories.map((cat) => {
            const status = cat.score >= 90 ? { color: '#00B86B', label: 'ممتاز', icon: <CheckCircle2 size={16} /> } : cat.score >= 75 ? { color: '#F59E0B', label: 'مقبول', icon: <AlertCircle size={16} /> } : { color: '#ef4444', label: 'ناقص', icon: <AlertCircle size={16} /> };
            return (
              <div key={cat.label} className="flex items-center gap-4">
                <div className="w-32 shrink-0">
                  <p className="text-sm font-semibold text-slate-700">{cat.label}</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
                <div className="w-20 text-left shrink-0">
                  <span className="text-sm font-extrabold tabular-nums" style={{ color: cat.color }}>{cat.score}%</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" style={{ color: status.color }}>
                  {status.icon}
                  <span className="text-xs font-bold">{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact of data quality */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-navy-800 text-white border-0">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-aiblue-300" />
          <h3 className="text-base font-bold">أثر جودة البيانات على دقة التحليل</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { range: '90-100%', label: 'جودة ممتازة', desc: 'تحليلات دقيقة جداً وثقة عالية في التوصيات', color: '#00B86B' },
            { range: '75-89%', label: 'جودة مقبولة', desc: 'تحليلات جيدة مع بعض الفجوات في البيانات', color: '#F59E0B' },
            { range: 'أقل من 75%', label: 'جودة منخفضة', desc: 'تحليلات محدودة — يلزم تحسين البيانات', color: '#ef4444' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-white/5 p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} style={{ color: item.color }} />
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.range}</span>
              </div>
              <p className="text-sm font-bold mb-1">{item.label}</p>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
