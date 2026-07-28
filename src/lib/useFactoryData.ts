import { useEffect, useState, useCallback } from 'react';
import { loadFactoryData, getActiveFactoryId, type FactoryDataBundle } from '@/lib/factoryDataContext';

/**
 * React hook that loads the active factory's data bundle from the real data
 * layer (Supabase) and falls back to demo data automatically.
 *
 * `reload()` re-fetches the bundle (e.g. after inserting new records).
 * The effect depends on the active factory id so switching factories
 * automatically reloads the entire data bundle.
 */
export function useFactoryData() {
  const [bundle, setBundle] = useState<FactoryDataBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factoryId, setFactoryId] = useState<string | null>(() => getActiveFactoryId());

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadFactoryData();
      setBundle(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, factoryId]);

  // Listen for factory switches performed elsewhere (e.g. the sidebar
  // switcher). We poll localStorage because it is the shared signal channel
  // used by useActiveFactory / setActiveFactoryId.
  useEffect(() => {
    const check = () => {
      const current = getActiveFactoryId();
      setFactoryId((prev) => (prev !== current ? current : prev));
    };
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  return { bundle, loading, error, reload };
}
