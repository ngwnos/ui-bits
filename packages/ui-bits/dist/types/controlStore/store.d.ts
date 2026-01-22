export type ControlStoreState = Record<string, unknown>;
export type ControlStoreListener = () => void;
export interface ControlStore {
    getState(): ControlStoreState;
    setValue: (id: string, value: unknown) => void;
    subscribe: (listener: ControlStoreListener) => () => void;
}
export declare function createControlStore(initialState?: ControlStoreState): ControlStore;
