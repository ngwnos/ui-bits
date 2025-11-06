import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";

export type FrameSubscriber = (nowSec: number, dtSec: number) => void;

type FrameLoopApi = { subscribe: (fn: FrameSubscriber) => () => void };

const FrameLoopContext = createContext<FrameLoopApi | null>(null);

export const FrameLoopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subs = useRef(new Set<FrameSubscriber>());
  const api = useMemo<FrameLoopApi>(() => ({
    subscribe(fn) {
      subs.current.add(fn);
      return () => subs.current.delete(fn);
    },
  }), []);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (nowMs: number) => {
      const nowSec = nowMs / 1000;
      const dtSec = (nowMs - prev) / 1000;
      prev = nowMs;
      subs.current.forEach((fn) => fn(nowSec, dtSec));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <FrameLoopContext.Provider value={api}>{children}</FrameLoopContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useFrame(fn: FrameSubscriber | null) {
  const ctx = useContext(FrameLoopContext);
  useEffect(() => {
    if (!ctx || !fn) return;
    return ctx.subscribe(fn);
  }, [ctx, fn]);
}
