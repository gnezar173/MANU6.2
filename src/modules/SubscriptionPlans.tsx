import { Check, Sparkles, Building2, Factory, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
      } else if (data) {
        setPlans(data as SubscriptionPlan[]);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const planIcons: Record<string, React.ReactNode> = {
    starter: <Zap size={24} />,
    professional: <Factory size={24} />,
    enterprise: <Building2 size={24} />,
  };

  const planColors: Record<string, string> = {
    starter: '#0066FF',
    professional: '#00B86B',
    enterprise: '#8b5cf6',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-aiblue-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">باقات الاشتراك</h2>
            <p className="text-sm text-white/60 mt-0.5">اختر الباقة المناسبة لمصنعك — قابل للترقية في أي وقت</p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="card p-12 text-center text-slate-400">جاري تحميل الباقات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const color = planColors[plan.plan_key] || '#0066FF';
            const isPopular = plan.is_popular;
            return (
              <div
                key={plan.id}
                className={`card p-6 relative ${isPopular ? 'border-2 border-success shadow-card-hover' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-success text-white text-xs font-bold">الأكثر شعبية</span>
                  </div>
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {planIcons[plan.plan_key]}
                </div>
                <h3 className="text-lg font-extrabold text-navy-900 mb-1">{plan.name_ar}</h3>
                <p className="text-xs text-slate-400 mb-4">{plan.name_en}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-navy-900 tabular-nums">{plan.price_monthly.toLocaleString('en-US')}</span>
                    <span className="text-sm text-slate-400">ر.ي / شهر</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {plan.max_factories === 1 ? 'مصنع واحد' : plan.max_factories >= 999 ? 'مصانع غير محدودة' : `حتى ${plan.max_factories} مصانع`}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${color}15`, color }}>
                        <Check size={12} />
                      </div>
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isPopular
                      ? 'bg-success text-white hover:bg-success-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {plan.plan_key === 'enterprise' ? 'تواصل معنا' : 'اختر الباقة'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison note */}
      <div className="card p-6 bg-aiblue-50/50 border-aiblue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-aiblue-100 flex items-center justify-center text-aiblue-600 shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">بنية قابلة للتوسع</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              ابدأ بالباقة المبتدئة لمصنع واحد، ورقّ للاحترافية عند الحاجة لمستشار AI ومشاريع التحسين، أو انتقل لباقة المؤسسات لدعم مصانع متعددة وتكامل ERP و IoT. جميع الباقات قابلة للترقية في أي وقت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
