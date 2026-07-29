import { Brain, Database, ArrowLeft } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function InsufficientDataState({
  title = 'البيانات غير كافية للتحليل',
  message = 'لا توجد بيانات تشغيل كافية لهذا المصنع. قم برفع بيانات الإنتاج والجودة لبدء التحليل الذكي.',
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="animate-fade-in">
      <div className="card p-10 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-aiblue-50 flex items-center justify-center mx-auto mb-5">
          <Database size={30} className="text-aiblue-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">{message}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-primary inline-flex items-center gap-2">
            {actionLabel}
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
