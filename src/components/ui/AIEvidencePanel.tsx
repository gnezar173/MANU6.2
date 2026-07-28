import { Database, AlertTriangle, ShieldCheck, Activity, Zap, Wrench, BarChart3 } from 'lucide-react';
import type { AIEvidence } from '@/types';

const sourceIcons: Record<string, React.ReactNode> = {
  production: <BarChart3 size={16} />,
  downtime: <AlertTriangle size={16} />,
  quality: <ShieldCheck size={16} />,
  energy: <Zap size={16} />,
  maintenance: <Wrench size={16} />,
};

export default function AIEvidencePanel({ evidence }: { evidence: AIEvidence }) {
  return (
    <div className="rounded-2xl bg-navy-900 text-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database size={18} className="text-aiblue-300" />
        <h4 className="text-sm font-bold">مصادر التحليل</h4>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-aiblue-600/30 text-aiblue-200 mr-auto">
          MIZAN AI Evidence
        </span>
      </div>

      <p className="text-xs text-white/50 mb-4">MIZAN AI لا يخمن. كل توصية مبنية على بيانات مصنعك الفعلية.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {evidence.dataSources.map((source, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-aiblue-300">{sourceIcons[source.icon]}</span>
              <span className="text-xs font-semibold text-white/80">{source.label}</span>
            </div>
            <p className="text-lg font-extrabold tabular-nums">{source.count.toLocaleString('en-US')}</p>
            <p className="text-[10px] text-white/40">سجل محلل</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Activity size={14} className="text-success" />
            <p className="text-[10px] text-white/50">اكتمال البيانات</p>
          </div>
          <p className="text-xl font-extrabold text-success tabular-nums">{evidence.dataCompleteness}%</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck size={14} className="text-aiblue-300" />
            <p className="text-[10px] text-white/50">ثقة التحليل</p>
          </div>
          <p className="text-xl font-extrabold text-aiblue-300 tabular-nums">{evidence.analysisConfidence}%</p>
        </div>
      </div>
    </div>
  );
}
