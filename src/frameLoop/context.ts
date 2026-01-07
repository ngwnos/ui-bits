import { createContext } from "react";

export type FrameSubscriber = (nowSec: number, dtSec: number) => void;

export type FrameLoopApi = { subscribe: (fn: FrameSubscriber) => () => void };

export const FrameLoopContext = createContext<FrameLoopApi | null>(null);
