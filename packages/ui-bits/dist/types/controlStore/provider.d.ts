import React from "react";
import { type ControlStore } from "./store";
export interface ControlStoreProviderProps {
    store?: ControlStore;
    autoIds?: boolean;
    controlIdPrefix?: string;
    children: React.ReactNode;
}
export declare function ControlStoreProvider({ store, autoIds, controlIdPrefix, children, }: ControlStoreProviderProps): import("react/jsx-runtime").JSX.Element;
