import type { ControlStoreState } from "./store";
export declare function useControlValue<T>(id?: string, fallback?: T): readonly [T | undefined, (next: T) => void];
export declare function useControlStoreState(): ControlStoreState | null;
