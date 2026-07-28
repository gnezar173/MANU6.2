import { useState, useEffect, useCallback } from 'react';
import { FolderKanban, Plus, X, Save, Trash2, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateAIRecommendations, generateDMAICStages, statusToStages } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';
import { getActiveFactoryId } from '@/lib/factoryDataContext';
import type { ProjectStatus, RecommendationCategory, DMAICStageData } from '@/types';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  detected: { label: 'مكتشف', color: '#64748b', bg: '#f1f5f9' },
  analyzing: { label: 'قيد التحليل', color: '#0066FF', bg: '#eef4ff' },
  approved: { label: 'تم اعتماد الحل', color: '#8b5cf6', bg: '#f5f3ff' },
  in_progress: { label: 'قيد التنفيذ', color: '#F59E0B', bg: '#fffbeb' },
  closed: { label: 'تم الإغلاق', color: '#06b6d4', bg: '#ecfeff' },
  measured: { label: 'تم قياس الأثر', color: '#00B86B', bg: '#e6f9f0' },
};

const statusOrder: ProjectStatus[] = ['detected', 'analyzing', 'approved', 'in_progress', 'closed', 'measured'];

interface ProjectRow {
  id: string;
  title: string;
  problem: string;
  root_cause: string | null;
  action_plan: string | null;
  owner: string | null;
  due_date: string | null;
  expected_saving: number;
  actual_saving: number;
  status: ProjectStatus;
  category: string;
  methodology: string;
  recommendation_id: string | null;
  dmaic_stages: unknown;
  created_at: string;
  updated_at: string;
}

interface ProjectsProps {
  pendingConversion?: { recommendationId: string } | null;
  onConversionHandled: () => void;
}

export default function ImprovementProjects({ pendingConversion, onConversionHandled }: ProjectsProps) {
  const { bundle } = useFactoryData();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectRow> | null>(null);
  const [factoryId, setFactoryId] = useState<string | null>(() => getActiveFactoryId());

  // Re-read the active factory id when the operator switches factories.
  useEffect(() => {
    const check = () => setFactoryId(getActiveFactoryId());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('improvement_projects')
      .select('*');
    if (factoryId) {
      query = query.eq('factory_id', factoryId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else if (data) {
      setProjects(data as ProjectRow[]);
    }
    setLoading(false);
  }, [factoryId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (pendingConversion) {
      const rec = generateAIRecommendations(bundle ?? undefined).find((r) => r.id === pendingConversion.recommendationId);
      if (rec) {
        setFormData({
          title: rec.problem.substring(0, 80),
          problem: rec.problem,
          root_cause: rec.rootCause,
          action_plan: rec.recommendation,
          category: rec.category,
          methodology: rec.methodologies[0],
          expected_saving: rec.financialImpact.expectedSavingMonthly,
          status: 'detected',
          owner: 'غير محدد',
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          dmaic_stages: generateDMAICStages(rec.problem),
          recommendation_id: rec.id,
        });
        setShowForm(true);
      }
      onConversionHandled();
    }
  }, [pendingConversion, onConversionHandled]);

  const handleSave = async () => {
    if (!formData || !formData.title || !formData.problem) return;

    const currentFactoryId = getActiveFactoryId();
    if (!currentFactoryId) {
      alert('لم يتم اختيار مصنع. لا يمكن حفظ المشروع.');
      return;
    }
    const { error } = await supabase.from('improvement_projects').insert({
      factory_id: currentFactoryId,
      title: formData.title,
      problem: formData.problem,
      root_cause: formData.root_cause || '',
      action_plan: formData.action_plan || '',
      owner: formData.owner || 'غير محدد',
      due_date: formData.due_date,
      expected_saving: formData.expected_saving || 0,
      actual_saving: 0,
      status: formData.status || 'detected',
      category: formData.category || 'maintenance',
      methodology: formData.methodology || 'DMAIC',
      recommendation_id: formData.recommendation_id || null,
      dmaic_stages: formData.dmaic_stages || [],
    });

    if (error) {
      console.error('Error saving project:', error);
      alert('حدث خطأ أثناء حفظ المشروع');
      return;
    }

    setShowForm(false);
    setFormData(null);
    fetchProjects();
  };

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    const project = projects.find((p) => p.id === id);
    const currentStages = (project?.dmaic_stages as DMAICStageData[] | null) ?? [];
    const baseStages = currentStages.length > 0
      ? currentStages
      : generateDMAICStages(project?.problem ?? '');
    const syncedStages = statusToStages(baseStages, status);

    const { error } = await supabase
      .from('improvement_projects')
      .update({
        status,
        dmaic_stages: syncedStages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('improvement_projects').delete().eq('id', id);
    if (error) {
      console.error('Error deleting project:', error);
      return;
    }
    fetchProjects();
  };

  const totalExpected = projects.reduce((a, p) => a + (p.expected_saving || 0), 0);
  const totalActual = projects.reduce((a, p) => a + (p.actual_saving || 0), 0);
  const activeCount = projects.filter((p) => p.status === 'in_progress' || p.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <FolderKanban size={20} className="text-white" />
            </div>
            <h3 className="section-title">مشاريع التحسين</h3>
          </div>
          <p className="text-xs text-slate-400">إدارة دورة حياة مشاريع التحسين</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 mb-1">إجمالي المشاريع</p>
          <p className="text-2xl font-extrabold text-navy-900 tabular-nums">{projects.length}</p>
          <p className="text-xs text-slate-400">{activeCount} نشط</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 mb-1">التوفير المتوقع</p>
          <p className="text-2xl font-extrabold text-aiblue-600 tabular-nums">{totalExpected.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي / شهر</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 mb-1">التوفير المحقق</p>
          <p className="text-2xl font-extrabold text-success tabular-nums">{totalActual.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي / شهر</p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between">
        <h3 className="section-title">قائمة المشاريع</h3>
        <button
          onClick={() => {
            setFormData({
              title: '',
              problem: '',
              root_cause: '',
              action_plan: '',
              owner: 'غير محدد',
              due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              expected_saving: 0,
              status: 'detected',
              category: 'maintenance',
              methodology: 'DMAIC',
              dmaic_stages: [],
            });
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          مشروع جديد
        </button>
      </div>

      {/* Form modal */}
      {showForm && formData && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">مشروع تحسين جديد</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">عنوان المشروع</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="مثال: صيانة وقائية لماكينة التشكيل رقم 2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">المشكلة</label>
                <textarea
                  value={formData.problem || ''}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="وصف المشكلة"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">السبب الجذري</label>
                <textarea
                  value={formData.root_cause || ''}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  className="input-field min-h-[60px]"
                  placeholder="السبب الجذري للمشكلة"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">خطة العمل</label>
                <textarea
                  value={formData.action_plan || ''}
                  onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="خطوات التنفيذ المقترحة"
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">المسؤول</label>
                <input
                  type="text"
                  value={formData.owner || ''}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">التوفير المتوقع (ر.ي/شهر)</label>
                <input
                  type="number"
                  value={formData.expected_saving || 0}
                  onChange={(e) => setFormData({ ...formData, expected_saving: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">التصنيف</label>
                <select
                  value={formData.category || 'maintenance'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RecommendationCategory })}
                  className="input-field"
                >
                  <option value="maintenance">صيانة</option>
                  <option value="quality">جودة</option>
                  <option value="production">إنتاج</option>
                  <option value="energy">طاقة</option>
                  <option value="cost">تكلفة</option>
                  <option value="waste">هدر</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary">
                <Save size={18} />
                حفظ المشروع
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-aiblue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">لا توجد مشاريع تحسين بعد</p>
          <p className="text-xs text-slate-400 mt-1">يمكنك إنشاء مشروع جديد أو تحويل توصية من قسم DMAIC</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const config = statusConfig[project.status];
            const currentStatusIdx = statusOrder.indexOf(project.status);
            return (
              <div key={project.id} className="card card-hover p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{project.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {project.methodology}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{project.problem}</p>
                    {project.root_cause && (
                      <div className="rounded-lg bg-aiblue-50 p-2 mb-2">
                        <p className="text-xs text-aiblue-700"><span className="font-bold">السبب الجذري:</span> {project.root_cause}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span>المسؤول: {project.owner}</span>
                      <span>الاستحقاق: {project.due_date}</span>
                      <span className="font-bold text-success">متوقع: {project.expected_saving?.toLocaleString('en-US')} ر.ي</span>
                      {project.actual_saving > 0 && (
                        <span className="font-bold text-success">محقق: {project.actual_saving?.toLocaleString('en-US')} ر.ي</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Lifecycle stepper */}
                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
                  {statusOrder.map((s, i) => {
                    const sConfig = statusConfig[s];
                    const isCompleted = i <= currentStatusIdx;
                    const isCurrent = i === currentStatusIdx;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(project.id, s)}
                        className="flex-1 group"
                        title={sConfig.label}
                      >
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: isCompleted ? sConfig.color : '#f1f5f9',
                            boxShadow: isCurrent ? `0 0 0 2px ${sConfig.color}40` : 'none',
                          }}
                        />
                        <p className={`text-[9px] mt-1 text-center ${isCompleted ? 'font-bold' : 'text-slate-400'}`} style={{ color: isCompleted ? sConfig.color : undefined }}>
                          {sConfig.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
