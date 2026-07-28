import { useState } from 'react';
import { LayoutDashboard, Settings, Database, Brain, FileText, MessageSquare, Factory, Crown, Search, GitBranch, FolderKanban, History, Calculator, Upload, Gauge, Grid3x3, Award, CreditCard, Building2, ChevronDown, Check } from 'lucide-react';
import type { FactoryContext } from '@/lib/factoryDataContext';

export type ModuleKey =
  | 'dashboard'
  | 'executive'
  | 'setup'
  | 'data'
  | 'import'
  | 'analysis'
  | 'rootcause'
  | 'dmaic'
  | 'advisor'
  | 'projects'
  | 'decisionlog'
  | 'financial'
  | 'priority'
  | 'impact'
  | 'dataquality'
  | 'subscription'
  | 'report';

interface SidebarProps {
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  collapsed: boolean;
  factory: FactoryContext | null;
  factories: FactoryContext[];
  onSelectFactory: (id: string | null) => void;
}

interface NavGroup {
  title: string;
  items: { key: ModuleKey; label: string; icon: React.ReactNode }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'الرئيسية',
    items: [
      { key: 'dashboard', label: 'لوحة المصنع الذكية', icon: <LayoutDashboard size={20} /> },
      { key: 'executive', label: 'ملخص الإدارة', icon: <Crown size={20} /> },
      { key: 'impact', label: 'مؤشر أثر MIZAN', icon: <Award size={20} /> },
    ],
  },
  {
    title: 'البيانات',
    items: [
      { key: 'setup', label: 'إعداد المصنع', icon: <Settings size={20} /> },
      { key: 'data', label: 'بيانات المصنع', icon: <Database size={20} /> },
      { key: 'import', label: 'مركز بيانات المصنع', icon: <Upload size={20} /> },
      { key: 'dataquality', label: 'ذكاء جودة البيانات', icon: <Gauge size={20} /> },
    ],
  },
  {
    title: 'ذكاء MIZAN AI',
    items: [
      { key: 'analysis', label: 'تحليل MIZAN AI', icon: <Brain size={20} /> },
      { key: 'rootcause', label: 'تحليل السبب الجذري', icon: <Search size={20} /> },
      { key: 'dmaic', label: 'منهجية DMAIC', icon: <GitBranch size={20} /> },
      { key: 'priority', label: 'مصفوفة الأولويات', icon: <Grid3x3 size={20} /> },
      { key: 'advisor', label: 'مساعد MIZAN AI', icon: <MessageSquare size={20} /> },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { key: 'projects', label: 'مشاريع التحسين', icon: <FolderKanban size={20} /> },
      { key: 'decisionlog', label: 'سجل القرارات', icon: <History size={20} /> },
      { key: 'financial', label: 'الأثر المالي', icon: <Calculator size={20} /> },
      { key: 'report', label: 'تقرير التحسين', icon: <FileText size={20} /> },
    ],
  },
  {
    title: 'المنصة',
    items: [
      { key: 'subscription', label: 'باقات الاشتراك', icon: <CreditCard size={20} /> },
    ],
  },
];

export default function Sidebar({ active, onNavigate, collapsed, factory, factories, onSelectFactory }: SidebarProps) {
  const [factoryMenuOpen, setFactoryMenuOpen] = useState(false);

  const factoryName = factory?.nameAr ?? 'مصنع الميزان لخزانات المياه';
  const factoryEmployees = factory?.employees ?? 0;
  const factoryShifts = factory?.shifts ?? 0;
  const isDemo = factory?.isDemo ?? true;

  return (
    <aside
      className={`fixed top-0 right-0 h-full bg-navy-900 text-white z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-aiblue-600 flex items-center justify-center shrink-0 shadow-glow-blue">
          <Factory size={24} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-extrabold leading-tight whitespace-nowrap">ميزان للتصنيع الذكي</h1>
            <p className="text-[11px] text-white/50 font-medium whitespace-nowrap">MIZAN Manufacturing AI</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 mb-2">{group.title}</p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-aiblue-600 text-white shadow-glow-blue'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && (
                      <span className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-navy-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Factory info + switcher */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="relative">
            <button
              onClick={() => setFactoryMenuOpen(!factoryMenuOpen)}
              className="w-full rounded-xl bg-white/5 p-3 hover:bg-white/10 transition-colors text-right"
            >
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">المصنع الحالي</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white leading-tight truncate">{factoryName}</p>
                <ChevronDown size={16} className={`text-white/40 shrink-0 transition-transform ${factoryMenuOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                <span className="text-[11px] text-white/50">
                  {isDemo ? 'وضع تجريبي' : 'نشط'} - {factoryEmployees} موظف - {factoryShifts} وردية
                </span>
              </div>
            </button>

            {factoryMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-navy-800 border border-white/10 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {factories.map((f) => {
                  const isActiveFactory = factory?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        onSelectFactory(f.id === 'demo' ? null : f.id);
                        setFactoryMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right transition-colors ${
                        isActiveFactory ? 'bg-aiblue-600/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{f.nameAr}</p>
                        <p className="text-[10px] text-white/40">
                          {f.isDemo ? 'وضع تجريبي' : `${f.employees} موظف`}
                        </p>
                      </div>
                      {isActiveFactory && <Check size={14} className="text-aiblue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/40 font-semibold text-center leading-tight">
              Powered by Indicators for Consultancy
            </p>
            <p className="text-[9px] text-white/30 text-center mt-0.5">© 2026 جميع الحقوق محفوظة</p>
          </div>
        </div>
      )}
    </aside>
  );
}
