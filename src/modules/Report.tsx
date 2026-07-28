import { FileText, Download, CheckCircle2, Clock, ArrowLeft, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { computeFactoryScore, computeKpis } from '@/lib/analysis';
import { generateAIRecommendations, mapAIRecommendations, generateFinancialImpact } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import type { Recommendation } from '@/types';

export default function Report({ onNavigate }: { onNavigate: (key: 'advisor') => void }) {
  const { bundle, loading } = useFactoryData();
  const recs: Recommendation[] = mapAIRecommendations(generateAIRecommendations(bundle ?? undefined));
  const score = computeFactoryScore(bundle ?? undefined);
  const kpis = computeKpis(bundle ?? undefined);
  const financialItems = generateFinancialImpact(bundle ?? undefined);

  const totalImpactValue = recs.reduce((sum, r) => sum + r.impactValue, 0);
  const totalMonthlySaving = financialItems.reduce((sum, f) => sum + f.expectedSaving, 0);
  const quickWins = recs.filter((r) => r.effort === 'low');
  const majorProjects = recs.filter((r) => r.effort === 'medium' || r.effort === 'high');

  const today = new Date();
  const reportDateStr = today.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const factoryName = bundle?.context?.nameAr ?? 'مصنع الميزان لخزانات المياه البلاستيكية';

  if (loading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-aiblue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">تقرير التحسين</h2>
              <p className="text-xs text-slate-400">تقرير شامل لتحسين أداء المصنع - يولد بواسطة MIZAN AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{reportDateStr}</span>
            <button onClick={() => window.print()} className="btn-ghost">
              <Download size={18} />
              تصدير PDF
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="card p-6 bg-gradient-to-l from-navy-50 to-white border-navy-100">
        <h3 className="section-title mb-4">الملخص التنفيذي</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          يعمل {factoryName} بمؤشر صحة <span className="font-bold text-navy-900">{score.current}/100</span>،
          وهو أقل من المستهدف (85). التحليل يكشف {recs.length} فرص تحسين يمكن أن ترفع المؤشر إلى <span className="font-bold text-success">{Math.min(100, score.current + totalImpactValue)}</span>،
          مع توفير متوقع يتجاوز <span className="font-bold text-success">{totalMonthlySaving.toLocaleString('en-US')} ر.ي</span> شهرياً.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-4 border border-slate-200">
            <p className="text-xs text-slate-400 mb-1">المؤشر الحالي</p>
            <p className="text-2xl font-extrabold text-navy-900 tabular-nums">{score.current}</p>
            <p className="text-xs text-slate-400">من 100</p>
          </div>
          <div className="rounded-xl bg-white p-4 border border-slate-200">
            <p className="text-xs text-slate-400 mb-1">المؤشر المتوقع</p>
            <p className="text-2xl font-extrabold text-success tabular-nums">{Math.min(100, score.current + totalImpactValue)}</p>
            <p className="text-xs text-success">+{totalImpactValue} نقطة</p>
          </div>
          <div className="rounded-xl bg-white p-4 border border-slate-200">
            <p className="text-xs text-slate-400 mb-1">فرص التحسين</p>
            <p className="text-2xl font-extrabold text-aiblue-600 tabular-nums">{recs.length}</p>
            <p className="text-xs text-slate-400">{quickWins.length} مكاسب سريعة</p>
          </div>
          <div className="rounded-xl bg-white p-4 border border-slate-200">
            <p className="text-xs text-slate-400 mb-1">التوفير المتوقع</p>
            <p className="text-2xl font-extrabold text-success tabular-nums">{(totalMonthlySaving / 1000).toFixed(0)}K</p>
            <p className="text-xs text-slate-400">ر.ي / شهر</p>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <CheckCircle2 size={18} />
          </div>
          <h3 className="section-title">المكاسب السريعة</h3>
          <span className="text-xs text-slate-400">جهد منخفض - أثر عالي</span>
        </div>
        <div className="space-y-3">
          {quickWins.map((rec, i) => (
            <div key={rec.id} className="card p-5 border-r-4 border-r-success">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-success text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <span className="font-bold text-success">{rec.impact}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{rec.methodology}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{rec.affectedArea}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Major Projects */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
            <Clock size={18} />
          </div>
          <h3 className="section-title">مشاريع التحسين</h3>
          <span className="text-xs text-slate-400">جهد متوسط/عالي - أثر كبير</span>
        </div>
        <div className="space-y-3">
          {majorProjects.map((rec, i) => (
            <div key={rec.id} className="card p-5 border-r-4 border-r-warning">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-warning text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <span className="font-bold text-success">{rec.impact}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{rec.methodology}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{rec.affectedArea}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">الجهد: {rec.effort === 'medium' ? 'متوسط' : 'عالي'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan Timeline */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-aiblue-600" />
          <h3 className="section-title">خطة التنفيذ المقترحة</h3>
        </div>
        <div className="space-y-4">
          {[
            { phase: 'المرحلة 1: إجراءات فورية', period: 'الأسبوع 1-2', items: ['صيانة وقائية عاجلة لماكينة التشكيل رقم 2', 'طلب إضافات UV وزيادة المخزون الاحتياطي'], color: '#ef4444' },
            { phase: 'المرحلة 2: مكاسب سريعة', period: 'الأسبوع 3-4', items: ['معايرة نظام التسخين لتقليل عيوب التشوه', 'زيادة الاعتماد على الطاقة الشمسية'], color: '#00B86B' },
            { phase: 'المرحلة 3: مشاريع تحسين', period: 'الشهر 2-3', items: ['تطبيق SMED لتقليل وقت تغيير القوالب', 'تركيب نظام تجفيف حبيبات البلاستيك'], color: '#F59E0B' },
            { phase: 'المرحلة 4: تحسين مستمر', period: 'الشهر 3+', items: ['مراجعة KPIs وتحديث الأهداف', 'تدريب الفريق على منهجيات التحسين'], color: '#0066FF' },
          ].map((phase, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: phase.color }}>
                  {i + 1}
                </div>
                {i < 3 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{phase.phase}</h4>
                  <span className="text-xs text-slate-400">{phase.period}</span>
                </div>
                <ul className="space-y-1.5">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30/60/90 Day Plan */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-aiblue-600" />
          <h3 className="section-title">خطة 30/60/90 يوم</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              period: '30 يوم',
              title: 'إجراءات فورية',
              color: '#ef4444',
              items: [
                'صيانة وقائية لماكينة التشكيل رقم 2',
                'طلب عاجل لإضافات UV',
                'معايرة نظام التسخين',
                'زيادة الاعتماد على الطاقة الشمسية',
              ],
              target: 'رفع المؤشر +5 نقاط',
            },
            {
              period: '60 يوم',
              title: 'مشاريع تحسين',
              color: '#F59E0B',
              items: [
                'تطبيق SMED لتغيير القوالب',
                'تركيب نظام تجفيف HDPE',
                'توثيق إجراءات التشغيل (SOP)',
                'تطبيق SPC لمراقبة العمليات',
              ],
              target: 'رفع المؤشر +10 نقاط',
            },
            {
              period: '90 يوم',
              title: 'استدامة التحسين',
              color: '#00B86B',
              items: [
                'تدريب الفريق على منهجيات التحسين',
                'مراجعة وتحديث KPIs',
                'نظام إدارة صيانة رقمي',
                'تحسين مستمر (Kaizen)',
              ],
              target: 'رفع المؤشر +15 نقطة',
            },
          ].map((plan, i) => (
            <div key={i} className="rounded-xl border-2 p-4" style={{ borderColor: `${plan.color}30` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: plan.color }}>
                  {plan.period}
                </div>
                <span className="text-sm font-bold text-slate-800">{plan.title}</span>
              </div>
              <ul className="space-y-2 mb-3">
                {plan.items.map((item, j) => (
                  <li key={j} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: plan.color }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold" style={{ color: plan.color }}>{plan.target}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card p-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold">هل تحتاج مساعدة في التنفيذ؟</h3>
            <p className="text-sm text-white/60">مساعد MIZAN AI يمكن أن يرشدك خطوة بخطوة لتنفيذ خطة التحسين</p>
          </div>
          <button onClick={() => onNavigate('advisor')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-navy-900 font-semibold text-sm hover:bg-white/90 transition-colors">
            استشر المساعد
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
