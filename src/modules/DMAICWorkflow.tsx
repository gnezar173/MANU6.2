import { useState, useEffect, useCallback } from 'react';
import { Brain, Target, Ruler, Search, Wrench, ShieldCheck, ArrowLeft, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { generateAIRecommendations, generateDMAICStages, stagesToStatus } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import { supabase } from '@/lib/supabase';
import { getActiveFactoryId } from '@/lib/factoryDataContext';
import type { DMAICStage, DMAICStageData } from '@/types';

const stageConfig: Record<DMAICStage, { labelAr: string; icon: React.ReactNode; color: string }> = {
  define: { labelAr: 'تعريف', icon: <Target size={20} />, color: '#0066FF' },
  measure: { labelAr: 'قياس', icon: <Ruler size={20} />, color: '#00B86B' },
  analyze: { labelAr: 'تحليل', icon: <Search size={20} />, color: '#F59E0B' },
  improve: { labelAr: 'تحسين', icon: <Wrench size={20} />, color: '#8b5cf6' },
  control: { labelAr: 'متابعة', icon: <ShieldCheck size={20} />, color: '#06b6d4' },
};

interface DMAICProps {
  onCreateProject: (recommendationId: string) => void;
}

export default function DMAICWorkflow({ onCreateProject }: DMAICProps) {
  const { bundle } = useFactoryData();
  const recs = generateAIRecommendations(bundle ?? undefined);
  const [selectedRec, setSelectedRec] = useState(recs[0].id);
  const [stages, setStages] = useState<DMAICStageData[]>(generateDMAICStages(recs[0].problem));
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);

  const rec = recs.find((r) => r.id === selectedRec)!;

  // Load saved DMAIC stages for the selected recommendation from the database.
  // If a tracked project exists for this recommendation, its persisted stages
  // become the single source of truth; otherwise we fall back to generated defaults.
  const loadSavedStages = useCallback(async (recommendationId: string) => {
    const factoryId = getActiveFactoryId();
    let query = supabase
      .from('improvement_projects')
      .select('id, dmaic_stages')
      .eq('recommendation_id', recommendationId);
    if (factoryId) {
      query = query.eq('factory_id', factoryId);
    }
    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      setLinkedProjectId(null);
      return null;
    }

    setLinkedProjectId(data.id);
    const saved = data.dmaic_stages as DMAICStageData[] | null;
    return Array.isArray(saved) && saved.length > 0 ? saved : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const r = recs.find((rr) => rr.id === selectedRec)!;
    loadSavedStages(selectedRec).then((saved) => {
      if (cancelled) return;
      setStages(saved ?? generateDMAICStages(r.problem));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRec]);

  const handleSelectRec = (id: string) => {
    setSelectedRec(id);
  };

  const toggleStage = async (stage: DMAICStage) => {
    const updated = stages.map((s) => (s.stage === stage ? { ...s, completed: !s.completed } : s));
    setStages(updated);

    if (!linkedProjectId) return;

    const { error } = await supabase
      .from('improvement_projects')
      .update({
        dmaic_stages: updated,
        status: stagesToStatus(updated),
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkedProjectId);

    if (error) {
      console.error('Error persisting DMAIC stage:', error);
    }
  };

  const completedCount = stages.filter((s) => s.completed).length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-aiblue-600 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">منهجية DMAIC للتحسين</h2>
            <p className="text-sm text-white/60 mt-0.5">تحويل التوصيات إلى مشاريع تحسين منهجية</p>
          </div>
        </div>
      </div>

      {/* Recommendation selector */}
      <div className="card p-4">
        <label className="label-text block mb-2">اختر التوصية لتحويلها إلى مشروع DMAIC</label>
        <select
          value={selectedRec}
          onChange={(e) => handleSelectRec(e.target.value)}
          className="input-field"
        >
          {recs.map((r) => (
            <option key={r.id} value={r.id}>{r.problem}</option>
          ))}
        </select>
      </div>

      {/* Problem summary */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-xs font-bold text-red-600 mb-1">المشكلة</p>
            <p className="text-sm font-semibold text-slate-800">{rec.problem}</p>
          </div>
          <div className="rounded-xl bg-aiblue-50 border border-aiblue-200 p-4">
            <p className="text-xs font-bold text-aiblue-600 mb-1">السبب الجذري</p>
            <p className="text-sm font-semibold text-slate-800">{rec.rootCause}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400">الأولوية</p>
            <p className={`text-sm font-bold ${rec.priority === 'critical' ? 'text-red-500' : rec.priority === 'high' ? 'text-warning' : 'text-aiblue-600'}`}>
              {rec.priority === 'critical' ? 'عاجلة' : rec.priority === 'high' ? 'عالية' : 'متوسطة'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400">درجة الثقة</p>
            <p className="text-sm font-bold text-navy-900 tabular-nums">{rec.confidenceScore}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400">التوفير الشهري</p>
            <p className="text-sm font-bold text-success tabular-nums">{rec.financialImpact.expectedSavingMonthly.toLocaleString('en-US')}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400">المنهجية</p>
            <p className="text-sm font-bold text-slate-700">{rec.methodologies.join(' + ')}</p>
          </div>
        </div>
      </div>

      {/* DMAIC Stages */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="section-title">مراحل DMAIC</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">التقدم:</span>
            <span className="text-sm font-bold text-aiblue-600 tabular-nums">{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-aiblue-600 to-success transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, i) => {
            const config = stageConfig[stage.stage];
            return (
              <div key={stage.stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => toggleStage(stage.stage)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      backgroundColor: stage.completed ? config.color : `${config.color}15`,
                      color: stage.completed ? 'white' : config.color,
                    }}
                  >
                    {stage.completed ? <CheckCircle2 size={24} /> : config.icon}
                  </button>
                  {i < stages.length - 1 && (
                    <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: stage.completed ? config.color : '#e2e8f0' }} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {stage.stage.toUpperCase()} - {stage.labelAr}
                    </h4>
                    <span className="text-xs text-slate-400">{stage.description}</span>
                    {stage.completed ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">مكتمل</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">قيد التنفيذ</span>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <pre className="text-sm text-slate-600 whitespace-pre-line font-sans">{stage.details}</pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Convert to project */}
        <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles size={18} className="text-aiblue-600" />
            <span>تحويل هذه التوصية إلى مشروع تحسين متتبع</span>
          </div>
          <button
            onClick={() => onCreateProject(rec.id)}
            className="btn-primary"
          >
            تحويل إلى مشروع
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
