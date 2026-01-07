import { useEffect, useRef } from "react";

export type MirrorFn = (value: number, tSec: number) => void;

export function useStoreMirror(
  readValue: () => number,
  mirror: MirrorFn | undefined,
  throttleMs = 16,
  epsilon = 1e-3,
) {
  const lastMs = useRef(0);
  const lastSent = useRef<number | null>(null);

  useEffect(() => {
    if (!mirror) return;
    let raf = 0;
    const tick = (ms: number) => {
      if (ms - lastMs.current >= throttleMs) {
        const v = readValue();
        if (lastSent.current === null || Math.abs(v - lastSent.current) >= epsilon) {
          mirror(v, ms / 1000);
          lastSent.current = v;
        }
        lastMs.current = ms;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mirror, throttleMs, epsilon, readValue]);
}

