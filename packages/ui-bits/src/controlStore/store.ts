export type ControlStoreState = Record<string, unknown>;
export type ControlStoreListener = () => void;

export interface ControlStore {
  getState(): ControlStoreState;
  setValue: (id: string, value: unknown) => void;
  subscribe: (listener: ControlStoreListener) => () => void;
}

export function createControlStore(initialState: ControlStoreState = {}): ControlStore {
  let state = { ...initialState };
  const listeners = new Set<ControlStoreListener>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    setValue: (id: string, value: unknown) => {
      const prev = state[id];
      if (Object.is(prev, value)) return;
      state = { ...state, [id]: value };
      notify();
    },
    subscribe: (listener: ControlStoreListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
