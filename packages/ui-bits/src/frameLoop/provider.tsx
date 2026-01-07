import React, { useEffect, useMemo, useRef } from "react";
import { FrameLoopContext, type FrameSubscriber } from "./context";

export const FrameLoopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subs = useRef(new Set<FrameSubscriber>());
  const api = useMemo(() => ({
    subscribe(fn: FrameSubscriber) {
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
