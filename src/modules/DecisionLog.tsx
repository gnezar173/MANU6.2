import { useState, useEffect, useCallback } from 'react';
import { History, Plus, X, Save, Trash2, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getActiveFactoryId } from '@/lib/factoryDataContext';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'بانتظار القرار', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'قيد التنفيذ', color: '#F59E0B', bg: '#fffbeb' },
  completed: { label: 'مكتمل', color: '#00B86B', bg: '#e6f9f0' },
  cancelled: { label: 'ملغي', color: '#ef4444', bg: '#fef2f2' },
};

type ImplStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface DecisionRow {
  id: string;
  date: string;
  problem: string;
  ai_recommendation: string;
  management_decision: string | null;
  implementation_status: ImplStatus;
  result: string | null;
  saving: number;
  created_at: string;
}

interface FormState {
  date: string;
  problem: string;
  aiRecommendation: string;
  managementDecision: string;
  implementationStatus: ImplStatus;
  result: string;
  saving: number;
}

export default function DecisionLog() {
  const [entries, setEntries] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormState | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [factoryId, setFactoryId] = useState<string | null>(() => getActiveFactoryId());

  // Re-read the active factory id when the operator switches factories.
  useEffect(() => {
    const check = () => setFactoryId(getActiveFactoryId());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('decision_log')
      .select('*');
    if (factoryId) {
      query = query.eq('factory_id', factoryId);
    }
    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching decision log:', error);
    } else if (data) {
      setEntries(data as DecisionRow[]);
    }
    setLoading(false);
  }, [factoryId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = async () => {
    if (!formData || !formData.problem || !formData.aiRecommendation) return;

    const currentFactoryId = getActiveFactoryId();
    if (!currentFactoryId) {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 5000);
      return;
    }
    const { error } = await supabase.from('decision_log').insert({
      factory_id: currentFactoryId,
      date: formData.date || new Date().toISOString().split('T')[0],
      problem: formData.problem,
      ai_recommendation: formData.aiRecommendation,
      management_decision: formData.managementDecision || '',
      implementation_status: formData.implementationStatus || 'pending',
      result: formData.result || '',
      saving: formData.saving || 0,
    });

    if (error) {
      console.error('Error saving decision:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 5000);
      return;
    }

    setShowForm(false);
    setFormData(null);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('decision_log').delete().eq('id', id);
    if (error) {
      console.error('Error deleting:', error);
      return;
    }
    fetchEntries();
  };

  const totalSavings = entries
    .filter((e) => e.implementation_status === 'completed')
    .reduce((a, e) => a + (e.saving || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <History size={20} className="text-white" />
            </div>
            <h3 className="section-title">سجل القرارات</h3>
          </div>
          <p className="text-xs text-slate-400">تتبع توصيات AI وقرارات الإدارة</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 mb-1">إجمالي القرارات</p>
          <p className="text-2xl font-extrabold text-navy-900 tabular-nums">{entries.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 mb-1">التوفير المحقق</p>
          <p className="text-2xl font-extrabold text-success tabular-nums">{totalSavings.toLocaleString('en-US')}</p>
          <p className="text-xs text-slate-400">ر.ي</p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between">
        <h3 className="section-title">سجل القرارات التاريخي</h3>
        <button
          onClick={() => {
            setFormData({
              date: new Date().toISOString().split('T')[0],
              problem: '',
              aiRecommendation: '',
              managementDecision: '',
              implementationStatus: 'pending',
              result: '',
              saving: 0,
            });
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          قرار جديد
        </button>
      </div>

      {/* Form modal */}
      {showForm && formData && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">قرار جديد</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">التاريخ</label>
                <input type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-text block mb-1.5">حالة التنفيذ</label>
                <select value={formData.implementationStatus || 'pending'} onChange={(e) => setFormData({ ...formData, implementationStatus: e.target.value as ImplStatus })} className="input-field">
                  <option value="pending">بانتظار القرار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">المشكلة المكتشفة</label>
                <textarea value={formData.problem || ''} onChange={(e) => setFormData({ ...formData, problem: e.target.value })} className="input-field min-h-[60px]" />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">توصية AI</label>
                <textarea value={formData.aiRecommendation || ''} onChange={(e) => setFormData({ ...formData, aiRecommendation: e.target.value })} className="input-field min-h-[60px]" />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">قرار الإدارة</label>
                <textarea value={formData.managementDecision || ''} onChange={(e) => setFormData({ ...formData, managementDecision: e.target.value })} className="input-field min-h-[60px]" />
              </div>
              <div className="md:col-span-2">
                <label className="label-text block mb-1.5">النتيجة</label>
                <textarea value={formData.result || ''} onChange={(e) => setFormData({ ...formData, result: e.target.value })} className="input-field min-h-[60px]" />
              </div>
              <div>
                <label className="label-text block mb-1.5">التوفير (ر.ي)</label>
                <input type="number" value={formData.saving || 0} onChange={(e) => setFormData({ ...formData, saving: parseInt(e.target.value) || 0 })} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary"><Save size={18} /> حفظ</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up">
          <span className="text-sm font-bold">فشل حفظ القرار - تحقق من اختيار المصنع والاتصال</span>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-aiblue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const config = statusConfig[entry.implementation_status] || statusConfig.pending;
            return (
              <div key={entry.id} className="card card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.bg, color: config.color }}>
                      <Calendar size={18} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs text-slate-400 tabular-nums">{entry.date}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      {entry.saving && entry.saving > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">
                          <TrendingUp size={10} className="inline ml-1" />
                          {entry.saving.toLocaleString('en-US')} ر.ي
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-bold text-red-500 mb-0.5">المشكلة</p>
                        <p className="text-sm text-slate-700">{entry.problem}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-aiblue-600 mb-0.5">توصية AI</p>
                        <p className="text-sm text-slate-600">{entry.ai_recommendation}</p>
                      </div>
                      {entry.management_decision && (
                        <div>
                          <p className="text-[10px] font-bold text-navy-700 mb-0.5">قرار الإدارة</p>
                          <p className="text-sm text-slate-600">{entry.management_decision}</p>
                        </div>
                      )}
                      {entry.result && (
                        <div>
                          <p className="text-[10px] font-bold text-success mb-0.5">النتيجة</p>
                          <p className="text-sm text-slate-600">{entry.result}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
