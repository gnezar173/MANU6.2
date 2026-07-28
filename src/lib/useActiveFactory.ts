import { useCallback, useEffect, useState } from 'react';
import {
  loadFactoryContext,
  listFactories,
  setActiveFactoryId,
  type FactoryContext,
} from './factoryDataContext';

/**
 * React hook for the active-factory switcher.
 *
 * - `factory` is the currently active factory context (demo fallback included).
 * - `factories` lists all factories available for selection.
 * - `selectFactory(id)` persists the choice and reloads the context.
 *   Pass `null` to return to the built-in demo factory.
 */
export function useActiveFactory() {
  const [factory, setFactory] = useState<FactoryContext | null>(null);
  const [factories, setFactories] = useState<FactoryContext[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ctx, list] = await Promise.all([
        loadFactoryContext(),
        listFactories(),
      ]);
      setFactory(ctx);
      setFactories(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectFactory = useCallback(
    async (id: string | null) => {
      setActiveFactoryId(id);
      await refresh();
    },
    [refresh],
  );

  return { factory, factories, loading, selectFactory, refresh };
}
