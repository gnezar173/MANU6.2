import { useState } from 'react';
import { Factory, Users, Clock, Zap, Package, Layers, Cog, CheckCircle2, Loader2, Plus, AlertCircle } from 'lucide-react';
import { useFactoryData } from '@/lib/useFactoryData';
import { useActiveFactory } from '@/lib/useActiveFactory';
import { useAuth } from '@/lib/auth';
import { createRealFactory } from '@/lib/factoryDataContext';

export default function FactorySetup() {
  const { bundle, loading } = useFactoryData();
  const { refresh } = useActiveFactory();
  const { profile } = useAuth();

  if (loading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-aiblue-600" />
      </div>
    );
  }

  if (!bundle) {
    return <FactoryCreationForm companyId={profile?.companyId ?? ''} onCreated={refresh} />;
  }

  const { profile: factoryProfile, productionLines, products, machines, processStages, rawMaterials } = bundle;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
            <Factory size={24} className="text-white" />
          </div>
          <div>
            <h3 className="section-title">ملف المصنع</h3>
            <p className="text-xs text-slate-400">البيانات الأساسية للمصنع</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoCard icon={<Factory size={18} />} label="اسم المصنع" value={factoryProfile.nameAr} />
          <InfoCard icon={<Layers size={18} />} label="الصناعة" value={factoryProfile.industry || 'تصنيع'} />
          <InfoCard icon={<Users size={18} />} label="عدد الموظفين" value={`${factoryProfile.employees} موظف`} />
          <InfoCard icon={<Clock size={18} />} label="الورديات" value={`${factoryProfile.shifts} وردية`} />
          <InfoCard icon={<Zap size={18} />} label="مصادر الطاقة" value={factoryProfile.powerSources.join('، ')} />
          <InfoCard icon={<Factory size={18} />} label="الدولة" value={factoryProfile.country} />
        </div>
      </div>

      {/* Production Lines */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-aiblue-50 flex items-center justify-center text-aiblue-600">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="section-title">خطوط الإنتاج</h3>
            <p className="text-xs text-slate-400">{productionLines.length} خطوط إنتاج</p>
          </div>
        </div>
        {productionLines.length === 0 ? (
          <EmptyState message="لا توجد خطوط إنتاج مسجلة بعد" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productionLines.map((line) => (
              <div key={line.id} className="rounded-xl border border-slate-200 p-4 hover:border-aiblue-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800">{line.nameAr}</h4>
                  <span className="text-xs font-semibold text-aiblue-600 bg-aiblue-50 px-2 py-1 rounded-md">
                    {line.shiftCapacity} وحدة/وردية
                  </span>
                </div>
                <div className="space-y-2">
                  {line.products.map((size) => {
                    const product = products.find((p) => p.size === size);
                    return (
                      <div key={size} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{product?.name}</span>
                        <span className="text-slate-400 text-xs">{product?.cycleTimeMin} دقيقة</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Package size={20} />
          </div>
          <div>
            <h3 className="section-title">المنتجات</h3>
            <p className="text-xs text-slate-400">{products.length} منتجات</p>
          </div>
        </div>
        {products.length === 0 ? (
          <EmptyState message="لا توجد منتجات مسجلة بعد" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right border-b border-slate-200">
                  <th className="pb-3 font-semibold text-slate-500 text-xs">المنتج</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">السعة</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">وزن المادة</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">زمن الدورة</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">التكلفة</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">السعر</th>
                  <th className="pb-3 font-semibold text-slate-500 text-xs">هامش الربح</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const margin = p.unitPrice > 0 ? ((p.unitPrice - p.unitCost) / p.unitPrice) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3 text-slate-600 tabular-nums">{p.capacityLiters} لتر</td>
                      <td className="py-3 text-slate-600 tabular-nums">{p.materialKg} كجم</td>
                      <td className="py-3 text-slate-600 tabular-nums">{p.cycleTimeMin} د</td>
                      <td className="py-3 text-slate-600 tabular-nums">{p.unitCost.toLocaleString('en-US')} ر.ي</td>
                      <td className="py-3 text-slate-600 tabular-nums">{p.unitPrice.toLocaleString('en-US')} ر.ي</td>
                      <td className="py-3">
                        <span className="font-bold text-success tabular-nums">{margin.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Machines */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
            <Cog size={20} />
          </div>
          <div>
            <h3 className="section-title">المعدات</h3>
            <p className="text-xs text-slate-400">{machines.length} معدات</p>
          </div>
        </div>
        {machines.length === 0 ? (
          <EmptyState message="لا توجد معدات مسجلة بعد" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">{m.nameAr}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'running'
                        ? 'text-success bg-success/10'
                        : m.status === 'down'
                        ? 'text-red-500 bg-red-50'
                        : m.status === 'maintenance'
                        ? 'text-warning bg-warning/10'
                        : 'text-slate-500 bg-slate-100'
                    }`}
                  >
                    {m.status === 'running' ? 'تعمل' : m.status === 'down' ? 'متوقفة' : m.status === 'maintenance' ? 'صيانة' : 'خاملة'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400">الإتاحة</p>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{m.availability}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">الأداء</p>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{m.performance}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">OEE</p>
                    <p className={`text-sm font-bold tabular-nums ${m.oee >= 75 ? 'text-success' : m.oee >= 60 ? 'text-warning' : 'text-red-500'}`}>
                      {m.oee}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process & Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="section-title">مراحل الإنتاج</h3>
              <p className="text-xs text-slate-400">{processStages.length} مراحل</p>
            </div>
          </div>
          {processStages.length === 0 ? (
            <EmptyState message="لا توجد مراحل إنتاج مسجلة" />
          ) : (
            <div className="space-y-2">
              {processStages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-aiblue-50 text-aiblue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {stage.order}
                  </div>
                  <div className="flex-1 flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{stage.nameAr}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="tabular-nums">{stage.cycleTimeMin} د</span>
                      <span className="tabular-nums text-success">{stage.yieldRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Package size={20} />
            </div>
            <div>
              <h3 className="section-title">المواد الخام</h3>
              <p className="text-xs text-slate-400">{rawMaterials.length} مواد</p>
            </div>
          </div>
          {rawMaterials.length === 0 ? (
            <EmptyState message="لا توجد مواد خام مسجلة" />
          ) : (
            <div className="space-y-3">
              {rawMaterials.map((rm) => {
                const daysLeft = rm.consumptionPerDayKg > 0 ? Math.floor(rm.stockKg / rm.consumptionPerDayKg) : 0;
                const lowStock = daysLeft < rm.leadTimeDays;
                return (
                  <div key={rm.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800">{rm.nameAr}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          lowStock ? 'text-red-500 bg-red-50' : 'text-success bg-success/10'
                        }`}
                      >
                        {daysLeft} يوم متبقي
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">المخزون</p>
                        <p className="font-semibold text-slate-700 tabular-nums">{rm.stockKg.toLocaleString('en-US')} كجم</p>
                      </div>
                      <div>
                        <p className="text-slate-400">الاستهلاك اليومي</p>
                        <p className="font-semibold text-slate-700 tabular-nums">{rm.consumptionPerDayKg} كجم</p>
                      </div>
                      <div>
                        <p className="text-slate-400">مدة التوريد</p>
                        <p className="font-semibold text-slate-700 tabular-nums">{rm.leadTimeDays} يوم</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-400 text-center py-8">{message}</p>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-800 truncate">{value || '—'}</p>
    </div>
  );
}

function FactoryCreationForm({ companyId, onCreated }: { companyId: string; onCreated: () => Promise<void> }) {
  const [nameAr, setNameAr] = useState('');
  const [industry, setIndustry] = useState('');
  const [employees, setEmployees] = useState('10');
  const [shifts, setShifts] = useState('1');
  const [country, setCountry] = useState('Yemen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setError('يرجى إدخال اسم المصنع');
      return;
    }
    if (!companyId) {
      setError('لم يتم العثور على بيانات الشركة. يرجى إعادة تسجيل الدخول.');
      return;
    }
    setLoading(true);
    setError(null);
    const factory = await createRealFactory({
      nameAr: nameAr.trim(),
      industry: industry.trim() || undefined,
      employees: Number(employees) || 0,
      shifts: Number(shifts) || 1,
      country: country.trim() || 'Yemen',
      companyId,
    });
    if (!factory) {
      setError('فشل إنشاء المصنع. يرجى المحاولة مرة أخرى.');
      setLoading(false);
      return;
    }
    await onCreated();
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
            <Plus size={24} className="text-white" />
          </div>
          <div>
            <h3 className="section-title">إنشاء مصنع جديد</h3>
            <p className="text-xs text-slate-400">أدخل البيانات الأساسية لمصنعك للبدء</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text block mb-1.5">اسم المصنع *</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="input-field"
              placeholder="مثال: مصنع النور للصناعات"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1.5">الصناعة</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input-field"
                placeholder="مثال: البلاستيك"
              />
            </div>
            <div>
              <label className="label-text block mb-1.5">الدولة</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1.5">عدد الموظفين</label>
              <input
                type="number"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label className="label-text block mb-1.5">عدد الورديات</label>
              <input
                type="number"
                value={shifts}
                onChange={(e) => setShifts(e.target.value)}
                className="input-field"
                min="1"
                max="3"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>إنشاء المصنع <Plus size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
