import { useContext, useEffect } from "react";
import { FrameLoopContext, type FrameSubscriber } from "./context";

export function useFrame(fn: FrameSubscriber | null) {
  const ctx = useContext(FrameLoopContext);
  useEffect(() => {
    if (!ctx || !fn) return;
    return ctx.subscribe(fn);
  }, [ctx, fn]);
}
