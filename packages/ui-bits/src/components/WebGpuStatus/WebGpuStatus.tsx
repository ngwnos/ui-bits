import React from "react";
import { usePanelTheme } from "../../panelGap";
import KeyValueRows from "../KeyValueRows";

export type WebGpuStatusBorderStyle = "a" | "b" | "none";

export interface WebGpuStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  colorA?: string;
  colorB?: string;
  borderStyle?: WebGpuStatusBorderStyle;
  fontSize?: number;
}

type WebGpuStatusState = {
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
  error?: string;
  adapterName?: string;
  isFallbackAdapter?: boolean;
  limits?: {
    maxTextureDimension2D?: number;
    maxTextureDimension3D?: number;
    maxBufferSize?: number;
    maxBindGroups?: number;
    maxStorageBuffersPerShaderStage?: number;
  };
  features?: string[];
};

type StatusRow = {
  label: string;
  value: string;
};

type AdapterInfoLike = { description?: string; device?: string; vendor?: string };
type AdapterWithInfo = GPUAdapter & {
  requestAdapterInfo?: () => Promise<AdapterInfoLike>;
  info?: AdapterInfoLike;
  isFallbackAdapter?: boolean;
};

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function computeRowHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function formatNumber(value?: number) {
  if (!Number.isFinite(value)) return "—";
  return Math.round(value as number).toLocaleString("en-US");
}

function formatBytes(value?: number) {
  if (!Number.isFinite(value)) return "—";
  const bytes = value as number;
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${Math.round(bytes)} B`;
}

const WebGpuStatus = React.forwardRef<HTMLDivElement, WebGpuStatusProps>((props, ref) => {
  const {
    colorA,
    colorB,
    borderStyle,
    fontSize,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const rowHeight = computeRowHeight(resolvedFontSize);
  const [state, setState] = React.useState<WebGpuStatusState>({ status: "idle" });
  const [fps, setFps] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof performance === "undefined" || typeof requestAnimationFrame === "undefined") return;
    let frameCount = 0;
    let lastSample = performance.now();
    let rafId = 0;
    const sample = (now: number) => {
      frameCount += 1;
      const elapsed = now - lastSample;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount / elapsed) * 1000));
        frameCount = 0;
        lastSample = now;
      }
      rafId = requestAnimationFrame(sample);
    };
    rafId = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(rafId);
  }, []);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setState({ status: "unavailable" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    const load = async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          if (!cancelled) {
            setState({ status: "unavailable" });
          }
          return;
        }
        const adapterWithInfo = adapter as AdapterWithInfo;
        let adapterName: string | undefined;
        if (typeof adapterWithInfo.requestAdapterInfo === "function") {
          const info = await adapterWithInfo.requestAdapterInfo();
          adapterName = info?.description || info?.device || info?.vendor;
        } else if (adapterWithInfo.info) {
          adapterName = adapterWithInfo.info.description
            || adapterWithInfo.info.device
            || adapterWithInfo.info.vendor;
        }
        const limits = adapter.limits;
        const features = Array.from(adapter.features ?? []);
        if (cancelled) return;
        setState({
          status: "ready",
          adapterName,
          isFallbackAdapter: adapterWithInfo.isFallbackAdapter,
          limits: {
            maxTextureDimension2D: limits.maxTextureDimension2D,
            maxTextureDimension3D: limits.maxTextureDimension3D,
            maxBufferSize: limits.maxBufferSize,
            maxBindGroups: limits.maxBindGroups,
            maxStorageBuffersPerShaderStage: limits.maxStorageBuffersPerShaderStage,
          },
          features,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = React.useMemo<StatusRow[]>(() => {
    const list: StatusRow[] = [];
    const statusValue = state.status === "ready"
      ? "Available"
      : state.status === "loading"
        ? "Checking"
        : state.status === "unavailable"
          ? "Unavailable"
          : state.status === "error"
            ? "Error"
            : "Idle";
    list.push({ label: "Status", value: statusValue });
    list.push({ label: "FPS", value: fps == null ? "—" : `${fps}` });
    if (state.status === "error" && state.error) {
      list.push({ label: "Error", value: state.error });
    }
    if (state.status !== "ready") return list;
    list.push({ label: "Adapter", value: state.adapterName ?? "Default" });
    if (state.isFallbackAdapter !== undefined) {
      list.push({ label: "Fallback", value: state.isFallbackAdapter ? "Yes" : "No" });
    }
    list.push({ label: "Max Texture 2D", value: formatNumber(state.limits?.maxTextureDimension2D) });
    list.push({ label: "Max Texture 3D", value: formatNumber(state.limits?.maxTextureDimension3D) });
    list.push({ label: "Max Buffer Size", value: formatBytes(state.limits?.maxBufferSize) });
    list.push({ label: "Max Bind Groups", value: formatNumber(state.limits?.maxBindGroups) });
    list.push({
      label: "Storage Buffers",
      value: formatNumber(state.limits?.maxStorageBuffersPerShaderStage),
    });
    return list;
  }, [fps, state]);

  return (
    <KeyValueRows
      ref={ref}
      rows={rows}
      className={["ui-bits-webgpu-status", className].filter(Boolean).join(" ")}
      colorA={resolvedColorA}
      colorB={resolvedColorB}
      borderStyle={resolvedBorderStyle}
      fontSize={resolvedFontSize}
      rowHeight={rowHeight}
      style={style}
      {...rest}
    />
  );
});

WebGpuStatus.displayName = "WebGpuStatus";

export default WebGpuStatus;
