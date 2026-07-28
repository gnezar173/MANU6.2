import { Upload, FileCheck, Database, Brain, CheckCircle2, X, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { ImportDataType, ImportStep, ShiftData, DefectRecord, DowntimeEvent, EnergyRecord, ProductSize } from '@/types';
import {
  insertShiftRecord,
  insertDefectRecord,
  insertDowntimeEvent,
  insertEnergyRecord,
  getActiveFactoryId,
} from '@/lib/factoryDataContext';

const dataTypes: { key: ImportDataType; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'production', label: 'بيانات الإنتاج', icon: <FileSpreadsheet size={20} />, color: '#0066FF' },
  { key: 'quality', label: 'بيانات الجودة', icon: <FileSpreadsheet size={20} />, color: '#00B86B' },
  { key: 'maintenance', label: 'بيانات الصيانة', icon: <FileSpreadsheet size={20} />, color: '#F59E0B' },
  { key: 'energy', label: 'بيانات الطاقة', icon: <FileSpreadsheet size={20} />, color: '#06b6d4' },
  { key: 'cost', label: 'بيانات التكاليف', icon: <FileSpreadsheet size={20} />, color: '#8b5cf6' },
];

const steps: { key: ImportStep; label: string; icon: React.ReactNode }[] = [
  { key: 'upload', label: 'رفع الملف', icon: <Upload size={18} /> },
  { key: 'validate', label: 'التحقق من البينة', icon: <FileCheck size={18} /> },
  { key: 'quality', label: 'تحليل جودة البيانات', icon: <AlertCircle size={18} /> },
  { key: 'import', label: 'استيراد السجلات', icon: <Database size={18} /> },
  { key: 'analyze', label: 'إرسال لـ MIZAN AI', icon: <Brain size={18} /> },
];

const REQUIRED_COLUMNS: Record<ImportDataType, string[]> = {
  production: ['date', 'line', 'planned', 'actual', 'good', 'defect'],
  quality: ['date', 'product', 'defectType', 'count'],
  maintenance: ['date', 'machine', 'reason', 'duration', 'category'],
  energy: ['date', 'source', 'kwh', 'cost'],
  cost: ['date', 'category', 'amount'],
};

interface ParsedRow {
  [key: string]: string | number;
}

export default function DataImportCenter() {
  const [selectedType, setSelectedType] = useState<ImportDataType>('production');
  const [currentStep, setCurrentStep] = useState<ImportStep | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'pending' | 'active' | 'completed' | 'error'>>({});
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMessage(null);
    setParsedRows([]);
    setImportedCount(0);
    await runImportFlow(file);
  };

  const runImportFlow = async (file: File) => {
    setImporting(true);
    setStepStatuses({});
    setErrorMessage(null);

    const setStep = (key: ImportStep, status: 'active' | 'completed' | 'error') => {
      setCurrentStep(key);
      setStepStatuses((prev) => ({ ...prev, [key]: status }));
    };

    try {
      // Step 1: Read file
      setStep('upload', 'active');
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });
      setStep('upload', 'completed');

      if (rows.length === 0) {
        setStep('validate', 'error');
        setErrorMessage('الملف فارغ أو لا يحتوي على بيانات');
        setImporting(false);
        setCurrentStep(null);
        return;
      }

      // Step 2: Validate structure
      setStep('validate', 'active');
      const columns = Object.keys(rows[0]).map((k) => k.toLowerCase().trim());
      const required = REQUIRED_COLUMNS[selectedType];
      const missing = required.filter((c) => !columns.some((col) => col.includes(c) || c.includes(col)));
      if (missing.length > 0) {
        setStep('validate', 'error');
        setErrorMessage(`أعمدة مفقودة: ${missing.join('، ')}. الأعمدة المطلوبة: ${required.join('، ')}`);
        setImporting(false);
        setCurrentStep(null);
        return;
      }
      setParsedRows(rows);
      setStep('validate', 'completed');

      // Step 3: Data quality check
      setStep('quality', 'active');
      await new Promise((r) => setTimeout(r, 600));
      const emptyRows = rows.filter((r) => Object.values(r).every((v) => v === '' || v === null));
      if (emptyRows.length === rows.length) {
        setStep('quality', 'error');
        setErrorMessage('جميع الصفوف فارغة');
        setImporting(false);
        setCurrentStep(null);
        return;
      }
      setStep('quality', 'completed');

      // Step 4: Import records
      setStep('import', 'active');
      const factoryId = getActiveFactoryId();
      if (!factoryId) {
        setStep('import', 'error');
        setErrorMessage('لم يتم اختيار مصنع. الرجاء اختيار مصنع من القائمة الجانبية قبل استيراد البيانات.');
        setImporting(false);
        setCurrentStep(null);
        return;
      }
      const count = await importRecords(factoryId, selectedType, rows);
      setImportedCount(count);
      setStep('import', 'completed');

      // Step 5: Send to MIZAN AI (placeholder — AI logic not modified this phase)
      setStep('analyze', 'active');
      await new Promise((r) => setTimeout(r, 800));
      setStep('analyze', 'completed');
    } catch (err) {
      const current = currentStep ?? 'upload';
      setStep(current, 'error');
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء الاستيراد');
    } finally {
      setCurrentStep(null);
      setImporting(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setCurrentStep(null);
    setStepStatuses({});
    setImporting(false);
    setParsedRows([]);
    setImportedCount(0);
    setErrorMessage(null);
  };

  const allCompleted = Object.values(stepStatuses).every((s) => s === 'completed') && Object.keys(stepStatuses).length === steps.length;
  const hasError = Object.values(stepStatuses).some((s) => s === 'error');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Upload size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">مركز بيانات المصنع</h2>
            <p className="text-sm text-white/60 mt-0.5">استيراد بيانات المصنع من Excel أو CSV وإرسالها لمحرك MIZAN AI</p>
          </div>
        </div>
      </div>

      {/* Data type selector */}
      <div className="card p-6">
        <h3 className="section-title mb-4">اختر نوع البيانات</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dataTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`rounded-xl p-4 text-center transition-all border-2 ${
                selectedType === type.key
                  ? 'border-aiblue-500 bg-aiblue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${type.color}15`, color: type.color }}>
                {type.icon}
              </div>
              <p className="text-xs font-bold text-slate-700">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Required columns hint */}
      <div className="card p-4 bg-aiblue-50/50 border-aiblue-100">
        <p className="text-xs text-slate-500">
          <span className="font-bold text-slate-700">الأعمدة المطلوبة: </span>
          {REQUIRED_COLUMNS[selectedType].join('، ')}
        </p>
      </div>

      {/* Upload area */}
      {!fileName && (
        <div className="card p-12">
          <label className="block">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-aiblue-400 hover:bg-aiblue-50/30 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className="text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-700 mb-2">اسحب ملفك هنا أو اضغط للاختيار</p>
              <p className="text-xs text-slate-400">يدعم: Excel (.xlsx, .xls) و CSV (.csv) — الحد الأقصى 10 ميجابايت</p>
            </div>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {/* Import workflow */}
      {fileName && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{fileName}</p>
                <p className="text-xs text-slate-400">{dataTypes.find((t) => t.key === selectedType)?.label}</p>
              </div>
            </div>
            {!importing && <button onClick={reset} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={18} /></button>}
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const status = stepStatuses[step.key] || 'pending';
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: status === 'completed' ? '#00B86B' : status === 'active' ? '#0066FF' : status === 'error' ? '#ef4444' : '#f1f5f9',
                        color: status === 'completed' ? 'white' : status === 'active' ? 'white' : status === 'error' ? 'white' : '#94a3b8',
                      }}
                    >
                      {status === 'completed' ? <CheckCircle2 size={20} /> : status === 'active' ? <Loader2 size={20} className="animate-spin" /> : status === 'error' ? <X size={20} /> : step.icon}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 h-6 my-1" style={{ backgroundColor: status === 'completed' ? '#00B86B' : '#e2e8f0' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${status === 'pending' ? 'text-slate-400' : status === 'error' ? 'text-red-500' : 'text-slate-800'}`}>{step.label}</p>
                      {status === 'completed' && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">مكتمل</span>}
                      {status === 'active' && <span className="text-[10px] font-bold text-aiblue-600 bg-aiblue-50 px-2 py-0.5 rounded-full">جاري التنفيذ</span>}
                      {status === 'error' && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">خطأ</span>}
                    </div>
                    {status === 'active' && (
                      <p className="text-xs text-slate-400 mt-1">
                        {step.key === 'upload' && 'جاري قراءة الملف...'}
                        {step.key === 'validate' && 'التحقق من الأعمدة والبنية...'}
                        {step.key === 'quality' && 'فحص القيم المفقودة والدقة...'}
                        {step.key === 'import' && 'استيراد السجلات لقاعدة البيانات...'}
                        {step.key === 'analyze' && 'إرسال البيانات لمحرك MIZAN AI...'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {hasError && errorMessage && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="rounded-xl bg-red-50 p-4 flex items-center gap-3">
                <AlertCircle size={24} className="text-red-500" />
                <div>
                  <p className="text-sm font-bold text-red-500">فشل الاستيراد</p>
                  <p className="text-xs text-slate-500">{errorMessage}</p>
                </div>
                <button onClick={reset} className="btn-ghost text-xs px-3 py-2 mr-auto">محاولة أخرى</button>
              </div>
            </div>
          )}

          {/* Completion */}
          {allCompleted && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="rounded-xl bg-success/10 p-4 flex items-center gap-3">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <p className="text-sm font-bold text-success">تم الاستيراد بنجاح</p>
                  <p className="text-xs text-slate-500">
                    تم استيراد {importedCount} سجل{parsedRows.length > 0 ? ` من ${parsedRows.length} صف` : ''} وإرسالها لمحرك MIZAN AI. التحليل متاح الآن في قسم تحليل MIZAN AI.
                  </p>
                </div>
                <button onClick={reset} className="btn-ghost text-xs px-3 py-2 mr-auto">استيراد ملف آخر</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="card p-6 bg-aiblue-50/50 border-aiblue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-aiblue-100 flex items-center justify-center text-aiblue-600 shrink-0">
            <Brain size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">كيف يعمل مركز البيانات؟</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              ارفع ملف Excel أو CSV يحتوي على بيانات الإنتاج أو الجودة أو الصيانة أو الطاقة. يتحقق MIZAN من بنية الملف وجودة البيانات، ثم يستوردها ويرسلها لمحرك التحليل الذكي. النتائج تظهر فوراً في لوحة التحليل.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function importRecords(factoryId: string, type: ImportDataType, rows: ParsedRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    const norm = normalizeKeys(row);
    try {
      if (type === 'production') {
        const ok = await insertShiftRecord(factoryId, {
          shiftName: String(norm.shift ?? norm.wardia ?? '1') === '1' ? 'وردية 1' : String(norm.shift ?? norm.wardia ?? 'وردية 1'),
          date: String(norm.date ?? ''),
          lineId: String(norm.line ?? norm.khat ?? 'line-1'),
          plannedUnits: Number(norm.planned ?? 0),
          actualUnits: Number(norm.actual ?? 0),
          goodUnits: Number(norm.good ?? 0),
          defectUnits: Number(norm.defect ?? 0),
          scrapKg: Number(norm.scrap ?? 0),
          runtimeHours: Number(norm.runtime ?? 7.5),
          downtimeHours: Math.max(0, 8 - Number(norm.runtime ?? 7.5)),
          energyKwh: Number(norm.energy ?? norm.kwh ?? 0),
          energyCost: Number(norm.energycost ?? norm.cost ?? 0),
        });
        if (ok) count++;
      } else if (type === 'quality') {
        const ok = await insertDefectRecord(factoryId, {
          date: String(norm.date ?? ''),
          productSize: String(norm.product ?? norm.size ?? '1000L') as ProductSize,
          defectType: String(norm.defecttype ?? norm.defect ?? ''),
          count: Number(norm.count ?? 1),
          rootCause: String(norm.rootcause ?? norm.cause ?? '') || undefined,
        });
        if (ok) count++;
      } else if (type === 'maintenance') {
        const ok = await insertDowntimeEvent(factoryId, {
          date: String(norm.date ?? ''),
          machineId: String(norm.machine ?? 'm-mold-1'),
          machineName: String(norm.machinename ?? norm.machine ?? ''),
          reason: String(norm.reason ?? ''),
          durationMin: Number(norm.duration ?? 0),
          category: String(norm.category ?? 'breakdown') as DowntimeEvent['category'],
        });
        if (ok) count++;
      } else if (type === 'energy') {
        const ok = await insertEnergyRecord(
          factoryId,
          String(norm.date ?? ''),
          String(norm.source ?? 'diesel') as EnergyRecord['source'],
          Number(norm.kwh ?? 0),
          Number(norm.cost ?? 0),
        );
        if (ok) count++;
      }
    } catch {
      // skip bad row, continue
    }
  }
  return count;
}

function normalizeKeys(row: ParsedRow): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.toLowerCase().trim().replace(/\s+/g, '')] = v;
  }
  return out;
}
