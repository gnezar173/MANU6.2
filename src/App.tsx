import { useState } from 'react';
import Sidebar, { type ModuleKey } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Landing from '@/modules/Landing';
import AuthScreen from '@/modules/AuthScreen';
import Dashboard from '@/modules/Dashboard';
import FactorySetup from '@/modules/FactorySetup';
import DataInput from '@/modules/DataInput';
import Analysis from '@/modules/Analysis';
import Report from '@/modules/Report';
import Advisor from '@/modules/Advisor';
import ExecutiveInsight from '@/modules/ExecutiveInsight';
import RootCauseAnalysis from '@/modules/RootCauseAnalysis';
import DMAICWorkflow from '@/modules/DMAICWorkflow';
import ImprovementProjects from '@/modules/ImprovementProjects';
import DecisionLog from '@/modules/DecisionLog';
import FinancialImpact from '@/modules/FinancialImpact';
import DataImportCenter from '@/modules/DataImportCenter';
import DataQuality from '@/modules/DataQuality';
import PriorityMatrix from '@/modules/PriorityMatrix';
import ImpactScore from '@/modules/ImpactScore';
import SubscriptionPlans from '@/modules/SubscriptionPlans';
import { useActiveFactory } from '@/lib/useActiveFactory';
import { AuthProvider, useAuth } from '@/lib/auth';

const moduleMeta: Record<ModuleKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'لوحة المصنع الذكية', subtitle: 'نظرة شاملة على أداء المصنع في الوقت الحقيقي' },
  executive: { title: 'ملخص الإدارة', subtitle: 'ملخص تنفيذي ذكي لأصحاب المصانع ومتخذي القرار' },
  impact: { title: 'مؤشر أثر MIZAN', subtitle: 'قياس القيمة التي يولدها MIZAN AI لمصنعك' },
  setup: { title: 'إعداد المصنع', subtitle: 'بيانات المصنع وخطوط الإنتاج والمعدات' },
  data: { title: 'بيانات المصنع', subtitle: 'إدخال وإدارة بيانات العمليات اليومية' },
  import: { title: 'مركز بيانات المصنع', subtitle: 'استيراد بيانات المصنع من Excel أو CSV' },
  dataquality: { title: 'ذكاء جودة البيانات', subtitle: 'قياس جودة بيانات المصنع ودقتها' },
  analysis: { title: 'تحليل MIZAN AI', subtitle: 'تحليل ذكي لعمليات المصنع ونتائج مفصلة' },
  rootcause: { title: 'تحليل السبب الجذري', subtitle: 'تحليل 5 Why و Fishbone للأسباب الجذرية' },
  dmaic: { title: 'منهجية DMAIC', subtitle: 'تحويل التوصيات إلى مشاريع تحسين منهجية' },
  priority: { title: 'مصفوفة الأولويات', subtitle: 'تصنيف المشاكل حسب الأثر والإلحاح' },
  advisor: { title: 'مساعد MIZAN AI', subtitle: 'مستشارك الصناعي الذكي للإجابة على أسئلتك' },
  projects: { title: 'مشاريع التحسين', subtitle: 'إدارة دورة حياة مشاريع التحسين' },
  decisionlog: { title: 'سجل القرارات', subtitle: 'تتبع توصيات AI وقرارات الإدارة' },
  financial: { title: 'الأثر المالي', subtitle: 'تحليل التكاليف والتوفير المتوقع' },
  report: { title: 'تقرير التحسين', subtitle: 'تقرير شامل بفرص التحسين وخطة التنفيذ' },
  subscription: { title: 'باقات الاشتراك', subtitle: 'اختر الباقة المناسبة لمصنعك' },
};

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState<ModuleKey>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [pendingConversion, setPendingConversion] = useState<{ recommendationId: string } | null>(null);
  const { factory, factories, selectFactory } = useActiveFactory();

  const meta = moduleMeta[active];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-navy-900 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (showLanding) {
    return <Landing onEnterPlatform={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        active={active}
        onNavigate={setActive}
        collapsed={collapsed}
        factory={factory}
        factories={factories}
        onSelectFactory={selectFactory}
      />
      <div className={`transition-all duration-300 ${collapsed ? 'mr-20' : 'mr-72'}`}>
        <Header
          onToggleSidebar={() => setCollapsed(!collapsed)}
          title={meta.title}
          subtitle={meta.subtitle}
          factory={factory}
          userName={profile?.fullName}
          onSignOut={signOut}
        />
        <main className="p-6">
          {active === 'dashboard' && <Dashboard onNavigate={(k) => setActive(k as ModuleKey)} />}
          {active === 'executive' && <ExecutiveInsight onNavigate={(k) => setActive(k as ModuleKey)} />}
          {active === 'impact' && <ImpactScore />}
          {active === 'setup' && <FactorySetup />}
          {active === 'data' && <DataInput />}
          {active === 'import' && <DataImportCenter />}
          {active === 'dataquality' && <DataQuality />}
          {active === 'analysis' && <Analysis />}
          {active === 'rootcause' && <RootCauseAnalysis />}
          {active === 'dmaic' && (
            <DMAICWorkflow onCreateProject={(recId) => { setPendingConversion({ recommendationId: recId }); setActive('projects'); }} />
          )}
          {active === 'priority' && <PriorityMatrix />}
          {active === 'advisor' && <Advisor />}
          {active === 'projects' && (
            <ImprovementProjects
              pendingConversion={pendingConversion}
              onConversionHandled={() => setPendingConversion(null)}
            />
          )}
          {active === 'decisionlog' && <DecisionLog />}
          {active === 'financial' && <FinancialImpact />}
          {active === 'report' && <Report onNavigate={(k) => setActive(k as ModuleKey)} />}
          {active === 'subscription' && <SubscriptionPlans />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
