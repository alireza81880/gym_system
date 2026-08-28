import { useSyncExternalStore } from 'react';

export interface Store<T> {
  getState: () => T;
  setState: (updater: Partial<T> | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater: Partial<T> | ((prev: T) => T)) => {
      const next = typeof updater === 'function'
        ? (updater as (prev: T) => T)(state)
        : (typeof updater === 'object' && updater !== null && !Array.isArray(updater)
          ? { ...state, ...updater }
          : updater as T);

      if (next !== state) {
        state = next;
        listeners.forEach(listener => {
          try {
            listener();
          } catch (e) {
            console.error('[Store] Subscriber error:', e);
          }
        });
      }
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = (s => s as unknown as S)
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
