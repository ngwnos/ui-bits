import React from "react";
export interface ControlIdConfig {
    autoIds: boolean;
    prefix?: string;
}
export declare function ControlIdProvider({ autoIds, prefix, children, }: ControlIdConfig & {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useControlIdConfig(): ControlIdConfig;
export declare function useResolvedControlId(explicitId: string | undefined, label?: string, fallbackLabel?: string): string | undefined;
export declare function useResolvedControlIdPrefix(explicitPrefix?: string, label?: string): string | undefined;
