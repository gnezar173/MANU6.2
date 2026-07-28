import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'owner' | 'manager' | 'engineer' | 'viewer';

export interface UserProfile {
  id: string;
  companyId: string;
  companyNameAr: string;
  companyNameEn: string;
  fullName: string;
  role: UserRole;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        company_id,
        full_name,
        role,
        companies (
          name_ar,
          name_en
        )
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const companyRows = data.companies as unknown as { name_ar: string; name_en: string | null }[] | null;
    const company = Array.isArray(companyRows) ? companyRows[0] : null;
    return {
      id: data.id,
      companyId: data.company_id,
      companyNameAr: company?.name_ar ?? '',
      companyNameEn: company?.name_en ?? '',
      fullName: data.full_name ?? '',
      role: data.role as UserRole,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          const p = await loadProfile(session.user.id);
          setProfile(p);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: 'فشل إنشاء الحساب' };

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name_ar: companyName, name_en: companyName, industry: 'Manufacturing' })
      .select('id')
      .single();

    if (companyError || !company) return { error: 'فشل إنشاء بيانات الشركة' };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        company_id: company.id,
        full_name: fullName,
        role: 'owner',
      });

    if (profileError) return { error: 'فشل إنشاء الملف الشخصي' };

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
