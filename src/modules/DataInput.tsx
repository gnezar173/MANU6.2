import { useState, type FormEvent } from 'react';
import { Plus, Calendar, Factory, Package, AlertTriangle, Zap, Save, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useFactoryData } from '@/lib/useFactoryData';
import {
  insertShiftRecord,
  insertDefectRecord,
  insertDowntimeEvent,
  insertEnergyRecord,
  getActiveFactoryId,
} from '@/lib/factoryDataContext';
import type { ProductSize, ShiftData, DefectRecord, DowntimeEvent, EnergyRecord } from '@/types';

type Tab = 'production' | 'quality' | 'downtime' | 'energy';

export default function DataInput() {
  const [tab, setTab] = useState<Tab>('production');
  const [showForm, setShowForm] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const { bundle, reload } = useFactoryData();

  const productionLines = bundle?.productionLines ?? [];
  const products = bundle?.products ?? [];
  const machines = bundle?.machines ?? [];
  const shiftData = bundle?.shiftData ?? [];
  const defectRecords = bundle?.defectRecords ?? [];
  const downtimeEvents = bundle?.downtimeEvents ?? [];
  const energyRecords = bundle?.energyRecords ?? [];

  const [errorMessage, setErrorMessage] = useState(false);

  const handleSaved = () => {
    setShowForm(false);
    setSavedMessage(true);
    reload();
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleSaveError = (msg: string) => {
    setSaving(false);
    setErrorMessage(true);
    console.error('Save failed:', msg);
    setTimeout(() => setErrorMessage(false), 5000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'production', label: 'بيانات الإنتاج', icon: <Factory size={18} /> },
    { key: 'quality', label: 'بيانات الجودة', icon: <Package size={18} /> },
    { key: 'downtime', label: 'بيانات التوقفات', icon: <AlertTriangle size={18} /> },
    { key: 'energy', label: 'بيانات الطاقة', icon: <Zap size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary mr-auto"
          disabled={!bundle}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'إلغاء' : 'إضافة بيانات'}
        </button>
      </div>

      {/* Form */}
      {showForm && bundle && (
        <div className="card p-6 animate-fade-in-up">
          <h3 className="section-title mb-4">إضافة بيانات جديدة</h3>
          {tab === 'production' && <ProductionForm lines={productionLines} saving={saving} setSaving={setSaving} onSaved={handleSaved} onError={handleSaveError} />}
          {tab === 'quality' && <QualityForm products={products} saving={saving} setSaving={setSaving} onSaved={handleSaved} onError={handleSaveError} />}
          {tab === 'downtime' && <DowntimeForm machines={machines} saving={saving} setSaving={setSaving} onSaved={handleSaved} onError={handleSaveError} />}
          {tab === 'energy' && <EnergyForm saving={saving} setSaving={setSaving} onSaved={handleSaved} onError={handleSaveError} />}
        </div>
      )}

      {savedMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 size={20} />
          <span className="text-sm font-bold">تم حفظ البيانات بنجاح</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">فشل حفظ البيانات - تحقق من الاتصال</span>
        </div>
      )}

      {/* Data tables */}
      <div className="card p-6">
        <h3 className="section-title mb-4">البيانات المسجلة</h3>
        {tab === 'production' && <ProductionTable shiftData={shiftData} lines={productionLines} />}
        {tab === 'quality' && <QualityTable defects={defectRecords} />}
        {tab === 'downtime' && <DowntimeTable events={downtimeEvents} />}
        {tab === 'energy' && <EnergyTable records={energyRecords} />}
      </div>
    </div>
  );
}

function ProductionForm({ lines, saving, setSaving, onSaved, onError }: {
  lines: { id: string; nameAr: string }[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const factoryId = getActiveFactoryId();
    if (!factoryId) { alert('لم يتم اختيار مصنع. لا يمكن حفظ البيانات.'); return; }

    setSaving(true);
    const row: Omit<ShiftData, 'id'> = {
      shiftName: String(fd.get('shift') ?? '1') === '1' ? 'وردية 1' : 'وردية 2',
      date: String(fd.get('date') ?? ''),
      lineId: String(fd.get('line') ?? ''),
      plannedUnits: Number(fd.get('planned') ?? 0),
      actualUnits: Number(fd.get('actual') ?? 0),
      goodUnits: Number(fd.get('good') ?? 0),
      defectUnits: Number(fd.get('defect') ?? 0),
      scrapKg: Number(fd.get('scrap') ?? 0),
      runtimeHours: Number(fd.get('runtime') ?? 0),
      downtimeHours: Math.max(0, 8 - Number(fd.get('runtime') ?? 0)),
      energyKwh: Number(fd.get('energy') ?? 0),
      energyCost: Number(fd.get('energyCost') ?? 0),
    };
    const ok = await insertShiftRecord(factoryId, row);
    if (!ok) {
      onError('فشل حفظ بيانات الإنتاج. تحقق من الاتصال بقاعدة البيانات.');
      return;
    }
    setSaving(false);
    onSaved();
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label-text block mb-1.5">التاريخ</label>
        <input name="date" type="date" className="input-field" defaultValue="2026-07-24" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">خط الإنتاج</label>
        <select name="line" className="input-field" required>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.nameAr}</option>)}
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">الوردية</label>
        <select name="shift" className="input-field">
          <option value="1">وردية 1</option>
          <option value="2">وردية 2</option>
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">الإنتاج المخطط</label>
        <input name="planned" type="number" className="input-field" placeholder="120" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">الإنتاج الفعلي</label>
        <input name="actual" type="number" className="input-field" placeholder="108" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المنتجات المطابقة</label>
        <input name="good" type="number" className="input-field" placeholder="102" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المنتجات المعيبة</label>
        <input name="defect" type="number" className="input-field" placeholder="6" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المخلفات (كجم)</label>
        <input name="scrap" type="number" className="input-field" placeholder="45" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">وقت التشغيل (ساعات)</label>
        <input name="runtime" type="number" step="0.1" className="input-field" placeholder="7.2" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">استهلاك الطاقة (kWh)</label>
        <input name="energy" type="number" className="input-field" placeholder="1200" />
      </div>
      <div>
        <label className="label-text block mb-1.5">تكلفة الطاقة (ر.ي)</label>
        <input name="energyCost" type="number" className="input-field" placeholder="102000" />
      </div>
      <div className="md:col-span-3 flex gap-3 mt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
        </button>
        <button type="button" onClick={onSaved} className="btn-ghost">إلغاء</button>
      </div>
    </form>
  );
}

function QualityForm({ products, saving, setSaving, onSaved, onError }: {
  products: { id: string; name: string; size: ProductSize }[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const factoryId = getActiveFactoryId();
    if (!factoryId) { alert('لم يتم اختيار مصنع. لا يمكن حفظ البيانات.'); return; }

    setSaving(true);
    const row: Omit<DefectRecord, 'id'> = {
      date: String(fd.get('date') ?? ''),
      productSize: String(fd.get('product') ?? '') as ProductSize,
      defectType: String(fd.get('defectType') ?? ''),
      count: Number(fd.get('count') ?? 0),
      rootCause: String(fd.get('rootCause') ?? '') || undefined,
    };
    const ok = await insertDefectRecord(factoryId, row);
    if (!ok) {
      onError('فشل حفظ بيانات الجودة. تحقق من الاتصال بقاعدة البيانات.');
      return;
    }
    setSaving(false);
    onSaved();
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label-text block mb-1.5">التاريخ</label>
        <input name="date" type="date" className="input-field" defaultValue="2026-07-24" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المنتج</label>
        <select name="product" className="input-field" required>
          {products.map((p) => <option key={p.id} value={p.size}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">نوع العيب</label>
        <select name="defectType" className="input-field" required>
          <option>تشوه في الشكل</option>
          <option>فقاعات هوائية</option>
          <option>سماكة غير متساوية</option>
          <option>لون غير مطابق</option>
          <option>تشقق في الحواف</option>
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">العدد</label>
        <input name="count" type="number" className="input-field" placeholder="5" required />
      </div>
      <div className="md:col-span-2">
        <label className="label-text block mb-1.5">السبب الجذري المحتمل</label>
        <input name="rootCause" type="text" className="input-field" placeholder="حرارة التشكيل غير متجانسة" />
      </div>
      <div className="md:col-span-3 flex gap-3 mt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button type="button" onClick={onSaved} className="btn-ghost">إلغاء</button>
      </div>
    </form>
  );
}

function DowntimeForm({ machines, saving, setSaving, onSaved, onError }: {
  machines: { id: string; nameAr: string }[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const factoryId = getActiveFactoryId();
    if (!factoryId) { alert('لم يتم اختيار مصنع. لا يمكن حفظ البيانات.'); return; }

    setSaving(true);
    const machineId = String(fd.get('machine') ?? '');
    const machine = machines.find((m) => m.id === machineId);
    const row: Omit<DowntimeEvent, 'id'> = {
      date: String(fd.get('date') ?? ''),
      machineId,
      machineName: machine?.nameAr ?? '',
      reason: String(fd.get('reason') ?? ''),
      durationMin: Number(fd.get('duration') ?? 0),
      category: String(fd.get('category') ?? 'breakdown') as DowntimeEvent['category'],
    };
    const ok = await insertDowntimeEvent(factoryId, row);
    if (!ok) {
      onError('فشل حفظ بيانات التوقفات. تحقق من الاتصال بقاعدة البيانات.');
      return;
    }
    setSaving(false);
    onSaved();
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label-text block mb-1.5">التاريخ</label>
        <input name="date" type="date" className="input-field" defaultValue="2026-07-24" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المعدة</label>
        <select name="machine" className="input-field" required>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">تصنيف الحدث</label>
        <select name="category" className="input-field">
          <option value="breakdown">عطل</option>
          <option value="planned">صيانة مخططة</option>
          <option value="changeover">تغيير قالب</option>
          <option value="material">نقص مواد</option>
          <option value="energy">طاقة</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label-text block mb-1.5">السبب</label>
        <input name="reason" type="text" className="input-field" placeholder="عطل في نظام التسخين" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">المدة (دقيقة)</label>
        <input name="duration" type="number" className="input-field" placeholder="120" required />
      </div>
      <div className="md:col-span-3 flex gap-3 mt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button type="button" onClick={onSaved} className="btn-ghost">إلغاء</button>
      </div>
    </form>
  );
}

function EnergyForm({ saving, setSaving, onSaved, onError }: {
  saving: boolean;
  setSaving: (v: boolean) => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const factoryId = getActiveFactoryId();
    if (!factoryId) { alert('لم يتم اختيار مصنع. لا يمكن حفظ البيانات.'); return; }

    setSaving(true);
  const ok = await insertEnergyRecord(
    factoryId,
    String(fd.get('date') ?? ''),
    String(fd.get('source') ?? 'diesel') as EnergyRecord['source'],
    Number(fd.get('kwh') ?? 0),
    Number(fd.get('cost') ?? 0),
  );
  if (!ok) {
    onError('فشل حفظ بيانات الطاقة. تحقق من الاتصال بقاعدة البيانات.');
    return;
  }
  setSaving(false);
  onSaved();
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="label-text block mb-1.5">التاريخ</label>
        <input name="date" type="date" className="input-field" defaultValue="2026-07-24" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">مصدر الطاقة</label>
        <select name="source" className="input-field">
          <option value="diesel">ديزل</option>
          <option value="solar">طاقة شمسية</option>
          <option value="grid">شبكة كهربائية</option>
        </select>
      </div>
      <div>
        <label className="label-text block mb-1.5">الاستهلاك (kWh)</label>
        <input name="kwh" type="number" className="input-field" placeholder="1200" required />
      </div>
      <div>
        <label className="label-text block mb-1.5">التكلفة (ر.ي)</label>
        <input name="cost" type="number" className="input-field" placeholder="102000" required />
      </div>
      <div className="md:col-span-3 flex gap-3 mt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button type="button" onClick={onSaved} className="btn-ghost">إلغاء</button>
      </div>
    </form>
  );
}

function ProductionTable({ shiftData, lines }: { shiftData: ShiftData[]; lines: { id: string; nameAr: string }[] }) {
  const recent = shiftData.slice(-12).reverse();
  if (recent.length === 0) return <p className="text-sm text-slate-400 text-center py-8">لا توجد بيانات إنتاج مسجلة</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-right border-b border-slate-200">
            <th className="pb-3 font-semibold text-slate-500 text-xs">التاريخ</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">الوردية</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">الخط</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">مخطط</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">فعلي</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">مطابق</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">معيب</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">مخلفات</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">طاقة</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((s) => {
            const line = lines.find((l) => l.id === s.lineId);
            return (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 text-slate-600 tabular-nums">{s.date}</td>
                <td className="py-3 text-slate-600">{s.shiftName}</td>
                <td className="py-3 text-slate-600">{line?.nameAr.split(' - ')[0]}</td>
                <td className="py-3 text-slate-600 tabular-nums">{s.plannedUnits}</td>
                <td className="py-3 font-semibold text-slate-800 tabular-nums">{s.actualUnits}</td>
                <td className="py-3 text-success tabular-nums font-semibold">{s.goodUnits}</td>
                <td className="py-3 text-red-500 tabular-nums">{s.defectUnits}</td>
                <td className="py-3 text-slate-600 tabular-nums">{s.scrapKg} كجم</td>
                <td className="py-3 text-slate-600 tabular-nums">{s.energyKwh} kWh</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QualityTable({ defects }: { defects: DefectRecord[] }) {
  const recent = defects.slice(0, 12);
  if (recent.length === 0) return <p className="text-sm text-slate-400 text-center py-8">لا توجد بيانات جودة مسجلة</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-right border-b border-slate-200">
            <th className="pb-3 font-semibold text-slate-500 text-xs">التاريخ</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">المنتج</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">نوع العيب</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">العدد</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">السبب الجذري</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-600 tabular-nums">{d.date}</td>
              <td className="py-3 text-slate-700 font-semibold">{d.productSize}</td>
              <td className="py-3 text-slate-600">{d.defectType}</td>
              <td className="py-3 text-red-500 font-bold tabular-nums">{d.count}</td>
              <td className="py-3 text-slate-500 text-xs">{d.rootCause ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DowntimeTable({ events }: { events: DowntimeEvent[] }) {
  const recent = events.slice(0, 12);
  if (recent.length === 0) return <p className="text-sm text-slate-400 text-center py-8">لا توجد توقفات مسجلة</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-right border-b border-slate-200">
            <th className="pb-3 font-semibold text-slate-500 text-xs">التاريخ</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">المعدة</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">السبب</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">التصنيف</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">المدة</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((e) => (
            <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-600 tabular-nums">{e.date}</td>
              <td className="py-3 text-slate-700 font-semibold">{e.machineName}</td>
              <td className="py-3 text-slate-600">{e.reason}</td>
              <td className="py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  e.category === 'breakdown' ? 'text-red-500 bg-red-50'
                  : e.category === 'planned' ? 'text-aiblue-600 bg-aiblue-50'
                  : e.category === 'material' ? 'text-warning bg-warning/10'
                  : 'text-slate-500 bg-slate-100'
                }`}>
                  {e.category === 'breakdown' ? 'عطل' : e.category === 'planned' ? 'صيانة' : e.category === 'changeover' ? 'تغيير قالب' : e.category === 'material' ? 'نقص مواد' : 'طاقة'}
                </span>
              </td>
              <td className="py-3 text-slate-700 font-bold tabular-nums">{e.durationMin} د</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnergyTable({ records }: { records: EnergyRecord[] }) {
  const recent = records.slice(-12).reverse();
  if (recent.length === 0) return <p className="text-sm text-slate-400 text-center py-8">لا توجد بيانات طاقة مسجلة</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-right border-b border-slate-200">
            <th className="pb-3 font-semibold text-slate-500 text-xs">التاريخ</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">المصدر</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">الاستهلاك (kWh)</th>
            <th className="pb-3 font-semibold text-slate-500 text-xs">التكلفة (ر.ي)</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r, i) => (
            <tr key={`${r.date}-${r.source}-${i}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-600 tabular-nums">{r.date}</td>
              <td className="py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.source === 'solar' ? 'text-success bg-success/10'
                  : r.source === 'diesel' ? 'text-warning bg-warning/10'
                  : 'text-aiblue-600 bg-aiblue-50'
                }`}>
                  {r.source === 'solar' ? 'طاقة شمسية' : r.source === 'diesel' ? 'ديزل' : 'شبكة كهربائية'}
                </span>
              </td>
              <td className="py-3 text-slate-700 font-bold tabular-nums">{r.kwh.toLocaleString('en-US')}</td>
              <td className="py-3 text-slate-700 tabular-nums">{r.cost.toLocaleString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
