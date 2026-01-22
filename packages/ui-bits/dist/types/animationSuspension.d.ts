import React from "react";
export interface AnimationSuspensionProviderProps {
    suspended?: boolean;
    children: React.ReactNode;
}
export declare function AnimationSuspensionProvider({ suspended, children, }: AnimationSuspensionProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAnimationSuspended(explicit?: boolean): boolean;
