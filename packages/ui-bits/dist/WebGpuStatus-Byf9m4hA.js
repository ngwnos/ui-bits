import { jsx as L } from "react/jsx-runtime";
import u from "react";
import { u as R } from "./panelGap-DjV8XIAA.js";
import { K as _ } from "./KeyValueRows-Czyi24Zz.js";
const N = "#2f2f2f", w = "#f0f0f0", z = 1, C = 0.35, k = 1;
function G(o) {
  const s = o * (z + C * 2);
  return Math.round(s + k * 2);
}
function m(o) {
  return Number.isFinite(o) ? Math.round(o).toLocaleString("en-US") : "—";
}
function q(o) {
  if (!Number.isFinite(o)) return "—";
  const s = o;
  return s >= 1024 * 1024 ? `${Math.round(s / (1024 * 1024))} MB` : s >= 1024 ? `${Math.round(s / 1024)} KB` : `${Math.round(s)} B`;
}
const H = u.forwardRef((o, s) => {
  const {
    colorA: b,
    colorB: x,
    borderStyle: h,
    fontSize: v,
    className: B,
    style: A,
    ...g
  } = o, c = R(), D = b ?? c?.colorA ?? N, y = x ?? c?.colorB ?? w, F = h ?? c?.borderStyle ?? "a", S = v ?? c?.fontSize ?? 12, M = G(S), [t, l] = u.useState({ status: "idle" }), [d, E] = u.useState(null);
  u.useEffect(() => {
    if (typeof performance > "u" || typeof requestAnimationFrame > "u") return;
    let e = 0, f = performance.now(), r = 0;
    const a = (i) => {
      e += 1;
      const n = i - f;
      n >= 500 && (E(Math.round(e / n * 1e3)), e = 0, f = i), r = requestAnimationFrame(a);
    };
    return r = requestAnimationFrame(a), () => cancelAnimationFrame(r);
  }, []), u.useEffect(() => {
    if (typeof navigator > "u" || !("gpu" in navigator)) {
      l({ status: "unavailable" });
      return;
    }
    let e = !1;
    return l({ status: "loading" }), (async () => {
      try {
        const r = await navigator.gpu.requestAdapter();
        if (!r) {
          e || l({ status: "unavailable" });
          return;
        }
        const a = r;
        let i;
        if (typeof a.requestAdapterInfo == "function") {
          const p = await a.requestAdapterInfo();
          i = p?.description || p?.device || p?.vendor;
        } else a.info && (i = a.info.description || a.info.device || a.info.vendor);
        const n = r.limits, I = Array.from(r.features ?? []);
        if (e) return;
        l({
          status: "ready",
          adapterName: i,
          isFallbackAdapter: a.isFallbackAdapter,
          limits: {
            maxTextureDimension2D: n.maxTextureDimension2D,
            maxTextureDimension3D: n.maxTextureDimension3D,
            maxBufferSize: n.maxBufferSize,
            maxBindGroups: n.maxBindGroups,
            maxStorageBuffersPerShaderStage: n.maxStorageBuffersPerShaderStage
          },
          features: I
        });
      } catch (r) {
        if (e) return;
        l({
          status: "error",
          error: r instanceof Error ? r.message : "Unknown error"
        });
      }
    })(), () => {
      e = !0;
    };
  }, []);
  const T = u.useMemo(() => {
    const e = [], f = t.status === "ready" ? "Available" : t.status === "loading" ? "Checking" : t.status === "unavailable" ? "Unavailable" : t.status === "error" ? "Error" : "Idle";
    return e.push({ label: "Status", value: f }), e.push({ label: "FPS", value: d == null ? "—" : `${d}` }), t.status === "error" && t.error && e.push({ label: "Error", value: t.error }), t.status !== "ready" || (e.push({ label: "Adapter", value: t.adapterName ?? "Default" }), t.isFallbackAdapter !== void 0 && e.push({ label: "Fallback", value: t.isFallbackAdapter ? "Yes" : "No" }), e.push({ label: "Max Texture 2D", value: m(t.limits?.maxTextureDimension2D) }), e.push({ label: "Max Texture 3D", value: m(t.limits?.maxTextureDimension3D) }), e.push({ label: "Max Buffer Size", value: q(t.limits?.maxBufferSize) }), e.push({ label: "Max Bind Groups", value: m(t.limits?.maxBindGroups) }), e.push({
      label: "Storage Buffers",
      value: m(t.limits?.maxStorageBuffersPerShaderStage)
    })), e;
  }, [d, t]);
  return /* @__PURE__ */ L(
    _,
    {
      ref: s,
      rows: T,
      className: ["ui-bits-webgpu-status", B].filter(Boolean).join(" "),
      colorA: D,
      colorB: y,
      borderStyle: F,
      fontSize: S,
      rowHeight: M,
      style: A,
      ...g
    }
  );
});
H.displayName = "WebGpuStatus";
export {
  H as W
};
//# sourceMappingURL=WebGpuStatus-Byf9m4hA.js.map
