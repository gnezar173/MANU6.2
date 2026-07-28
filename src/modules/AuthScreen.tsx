import { useState } from 'react';
import { Factory, ArrowLeft, Mail, Lock, User, Building2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!fullName.trim() || !companyName.trim()) {
        setError('يرجى ملء جميع الحقول');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, companyName);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center">
              <Factory size={20} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-navy-900">ميزان للتصنيع الذكي</span>
              <span className="hidden sm:inline text-xs text-slate-400 mr-2">| MIZAN Manufacturing AI</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
                <Factory size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy-900">
                {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'signin' ? 'ادخل إلى منصة MIZAN AI' : 'ابدأ رحلتك مع MIZAN AI'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 animate-fade-in">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="label-text block mb-1.5">الاسم الكامل</label>
                    <div className="relative">
                      <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field pr-10"
                        placeholder="مثال: أحمد محمد"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text block mb-1.5">اسم الشركة</label>
                    <div className="relative">
                      <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="input-field pr-10"
                        placeholder="مثال: شركة الميزان للصناعات"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="label-text block mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pr-10"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-text block mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                    <ArrowLeft size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-sm text-aiblue-600 hover:text-aiblue-700 font-semibold transition-colors"
              >
                {mode === 'signin' ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
