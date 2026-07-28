import { Factory, Brain, TrendingUp, ShieldCheck, Zap, Trash2, ArrowLeft, CheckCircle2, BarChart3, Target, DollarSign, Cog, Sparkles, Building2 } from 'lucide-react';
import { computeFactoryScore } from '@/lib/analysis';

interface LandingProps {
  onEnterPlatform: () => void;
}

export default function Landing({ onEnterPlatform }: LandingProps) {
  const score = computeFactoryScore();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center">
              <Factory size={20} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-navy-900">ميزان للتصنيع الذكي</span>
              <span className="hidden sm:inline text-xs text-slate-400 mr-2">| MIZAN Manufacturing AI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onEnterPlatform} className="text-sm font-semibold text-aiblue-600 hover:text-aiblue-700 transition-colors">
              تجربة المنصة
            </button>
            <button onClick={onEnterPlatform} className="btn-primary text-xs px-4 py-2">
              ابدأ الآن
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-aiblue-100/40 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aiblue-50 border border-aiblue-100 text-aiblue-600 text-xs font-semibold mb-6 animate-fade-in">
            <Sparkles size={14} />
            منصة ذكاء صناعي للقرارات التشغيلية
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-navy-900 leading-tight mb-6 animate-fade-in-up">
            حوّل بيانات مصنعك إلى
            <br />
            <span className="bg-gradient-to-l from-aiblue-600 to-success bg-clip-text text-transparent">قرارات ذكية</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up">
            MIZAN Manufacturing AI هو مستشارك الصناعي الذكي. يحلل عمليات مصنعك، يكتشف المشاكل، يحدد الأسباب الجذرية، ويوصي بقرارات تحسين تزيد الإنتاجية وتقلل التكاليف.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in-up">
            <button onClick={onEnterPlatform} className="btn-primary text-base px-8 py-3.5">
              استكشف المنصة
              <ArrowLeft size={20} />
            </button>
            <button onClick={onEnterPlatform} className="btn-ghost text-base px-8 py-3.5">
              <Brain size={20} />
              شاهد تحليل AI
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {[
              { value: `${score.current}/100`, label: 'مؤشر صحة المصنع', icon: <BarChart3 size={18} /> },
              { value: '6+', label: 'مجالات تحليل', icon: <Brain size={18} /> },
              { value: '10+', label: 'منهجيات صناعية', icon: <Target size={18} /> },
              { value: '1.5M+', label: 'توفير متوقع (ر.ي/شهر)', icon: <DollarSign size={18} /> },
            ].map((stat, i) => (
              <div key={i} className="card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600 mx-auto mb-2">
                  {stat.icon}
                </div>
                <p className="text-xl font-extrabold text-navy-900 tabular-nums">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">المشكلة</span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">المصانع تفقد المال كل يوم دون أن تعرف</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Cog size={24} />, title: 'توقفات غير متوقعة', desc: 'المعدات تتوقف فجأة، الإنتاج يتعطل، والتكاليف ترتفع دون إنذار مسبق' },
              { icon: <Trash2 size={24} />, title: 'هدر خفي', desc: 'مخلفات الإنتاج، المنتجات المعيبة، والطاقة المهدرة تستهلك الأرباح بصمت' },
              { icon: <TrendingUp size={24} />, title: 'قرارات بلا بيانات', desc: 'القرارات تعتمد على الحدس وليس التحليل، مما يفاقم المشاكل بدلاً من حلها' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-red-50/50 border border-red-100 p-6">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 px-6 bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-aiblue-600/20 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-aiblue-300 uppercase tracking-wider">الحل</span>
            <h2 className="text-3xl font-extrabold mt-2">MIZAN AI يحلل، يكتشف، ويوصي</h2>
            <p className="text-sm text-white/50 mt-3 max-w-xl mx-auto">ليس لوحة تحكم. ليس أداة تقارير. بل مستشار صناعي ذكي يعمل داخل مصنعك</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Brain size={24} />, title: 'تحليل ذكي', desc: 'يحلل بيانات الإنتاج والجودة والصيانة والطاقة' },
              { icon: <Target size={24} />, title: 'اكتشاف المشاكل', desc: 'يحدد المشاكل قبل أن تؤثر على الإنتاج' },
              { icon: <Sparkles size={24} />, title: 'توصيات عملية', desc: 'يوصي بإجراءات تحسين مع الأثر المالي المتوقع' },
              { icon: <ShieldCheck size={24} />, title: 'قياس الأثر', desc: 'يتابع النتائج ويقيس التوفير المحقق' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-aiblue-600 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How MIZAN Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-aiblue-600 uppercase tracking-wider">كيف يعمل</span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">من البيانات إلى القرار في 4 خطوات</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'جمع البيانات', desc: 'إدخال أو استيراد بيانات الإنتاج والجودة والصيانة', icon: <BarChart3 size={20} /> },
              { step: '2', title: 'تحليل AI', desc: 'محرك MIZAN يحلل البيانات ويكتشف المشاكل', icon: <Brain size={20} /> },
              { step: '3', title: 'توصيات ذكية', desc: 'توصيات مع السبب الجذري والأثر المالي', icon: <Target size={20} /> },
              { step: '4', title: 'قياس النتائج', desc: 'تتبع التحسينات وقياس التوفير المحقق', icon: <TrendingUp size={20} /> },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card p-6 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-aiblue-600 text-white flex items-center justify-center font-extrabold text-sm">
                      {item.step}
                    </div>
                    <div className="text-aiblue-600">{item.icon}</div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-0.5 bg-slate-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factory Example */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-success uppercase tracking-wider">مثال واقعي</span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">مصنع الميزان لخزانات المياه</h2>
            <p className="text-sm text-slate-500 mt-2">95 موظف - 3 خطوط إنتاج - خزانات بلاستيكية 500-5000 لتر</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-red-500 mb-4">قبل MIZAN AI</h3>
              <div className="space-y-3">
                {[
                  { label: 'OEE', value: '62%' },
                  { label: 'معدل العيوب', value: '5.8%' },
                  { label: 'نسبة التوقفات', value: '14%' },
                  { label: 'تكلفة الهدر', value: '1.2M ر.ي/شهر' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-bold text-red-500 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6 border-success/20 bg-gradient-to-l from-success/5 to-white">
              <h3 className="text-sm font-bold text-success mb-4">بعد MIZAN AI</h3>
              <div className="space-y-3">
                {[
                  { label: 'OEE', value: '75%', improvement: '+13%' },
                  { label: 'معدل العيوب', value: '2.1%', improvement: '-3.7%' },
                  { label: 'نسبة التوقفات', value: '6%', improvement: '-8%' },
                  { label: 'تكلفة الهدر', value: '720K ر.ي/شهر', improvement: '-40%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-success/10">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-success tabular-nums">{item.value}</span>
                      <span className="text-xs font-bold text-success bg-success/20 px-1.5 py-0.5 rounded">{item.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-aiblue-600 uppercase tracking-wider">قدرات AI</span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">منهجيات صناعية متقدمة</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'DMAIC', desc: 'تحسين العمليات' },
              { name: '5 Why', desc: 'تحليل الأسباب' },
              { name: 'Pareto', desc: 'تحليل الأولويات' },
              { name: 'Fishbone', desc: 'تحليل شامل' },
              { name: 'OEE', desc: 'كفاءة المعدات' },
              { name: 'TPM', desc: 'صيانة شاملة' },
              { name: 'SMED', desc: 'تبديل سريع' },
              { name: 'SPC', desc: 'تحكم إحصائي' },
              { name: 'FMEA', desc: 'تحليل المخاطر' },
              { name: 'Kaizen', desc: 'تحسين مستمر' },
            ].map((item, i) => (
              <div key={i} className="card p-4 text-center hover:shadow-card-hover transition-all">
                <p className="text-sm font-extrabold text-navy-900">{item.name}</p>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Benefits */}
      <section className="py-20 px-6 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-success uppercase tracking-wider">الفوائد</span>
            <h2 className="text-3xl font-extrabold mt-2">أرباح أكثر، هدر أقل، قرارات أفضل</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <TrendingUp size={28} />, title: 'زيادة الإنتاجية', value: '+10%', desc: 'رفع كفاءة الإنتاج' },
              { icon: <Trash2 size={28} />, title: 'تقليل الهدر', value: '-40%', desc: 'خفض المخلفات والعيوب' },
              { icon: <DollarSign size={28} />, title: 'خفض التكاليف', value: '-18%', desc: 'تقليل تكاليف الطاقة' },
              { icon: <ShieldCheck size={28} />, title: 'تحسين الجودة', value: '+6%', desc: 'رفع معدل الجودة' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-success/20 text-success flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <p className="text-3xl font-extrabold text-success mb-1 tabular-nums">{item.value}</p>
                <p className="text-sm font-bold mb-1">{item.title}</p>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">جاهز لتحويل مصنعك؟</h2>
          <p className="text-lg text-white/70 mb-8">ابدأ تجربة MIZAN AI اليوم واكتشف فرص التحسين في مصنعك</p>
          <button onClick={onEnterPlatform} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-navy-900 font-bold text-base hover:bg-white/90 transition-colors">
            استكشف منصة MIZAN
            <ArrowLeft size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-navy-950 text-white/40 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Factory size={16} />
          <span className="text-sm font-bold text-white/60">ميزان للتصنيع الذكي</span>
        </div>
        <p className="text-xs">MIZAN Manufacturing AI - منصة ذكاء صناعي للمصانع | 2026</p>
        <p className="text-[11px] mt-2 text-white/30">© 2026 Indicators for Consultancy | انديكيتورز للاستشارات — All Rights Reserved | جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
