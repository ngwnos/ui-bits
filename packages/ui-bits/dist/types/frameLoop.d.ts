import React from "react";
export type FrameSubscriber = (nowSec: number, dtSec: number) => void;
export declare const FrameLoopProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare function useFrame(fn: FrameSubscriber | null): void;
