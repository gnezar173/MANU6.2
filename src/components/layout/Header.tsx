import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { computeFactoryScore } from '@/lib/analysis';
import type { FactoryContext } from '@/lib/factoryDataContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  subtitle: string;
  factory: FactoryContext | null;
  userName?: string;
  onSignOut?: () => void;
}

export default function Header({ onToggleSidebar, title, subtitle, factory, userName, onSignOut }: HeaderProps) {
  const score = computeFactoryScore();
  const factoryName = factory?.nameAr ?? 'مصنع الميزان لخزانات المياه';
  const displayName = userName ?? 'مدير المصنع';
  const initials = displayName.charAt(0);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="bg-transparent text-sm outline-none w-40 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-50 border border-navy-100">
          <div className="text-left">
            <p className="text-[10px] text-slate-500 font-medium">مؤشر صحة المصنع</p>
            <p className="text-sm font-extrabold text-navy-900 tabular-nums">{score.current}<span className="text-xs font-normal text-slate-400">/100</span></p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
            style={{ backgroundColor: score.current >= 80 ? '#00B86B' : score.current >= 60 ? '#F59E0B' : '#ef4444' }}
          >
            {score.current}
          </div>
        </div>

        <button className="relative w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-warning" />
        </button>

        <div className="flex items-center gap-2 pr-2">
          <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-bold text-slate-700">{displayName}</p>
            <p className="text-[11px] text-slate-400">{factoryName}</p>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
