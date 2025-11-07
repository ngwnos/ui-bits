import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "../../frameLoop";
import {
  clamp,
  lfoValue,
  snapToStep,
  splitFromValue,
  valueFromSplit,
} from "../../lfo";
import type { LfoSettings, Waveform } from "../../lfo";
import { useStoreMirror } from "../../useStoreMirror";
import type { MirrorFn } from "../../useStoreMirror";
import {
  applyReplace,
  extendStep,
  hexToRGBA,
  isAllowedNumericChar,
  normalizeSelection,
  precisionFrom,
} from "./utils";
import "./lfoslider.css";
export type SliderBorder = 'left' | 'right' | 'none';

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};


const DRAWER_ICON_DEFS: Array<{
  waveform: Waveform;
  label: string;
  path: string;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
}> = [
  {
    waveform: 'sine',
    label: 'Sine',
    path: 'M0.000 37.500 L1.562 33.824 L3.125 30.184 L4.688 26.614 L6.250 23.149 L7.812 19.823 L9.375 16.666 L10.938 13.710 L12.500 10.983 L14.062 8.512 L15.625 6.320 L17.188 4.428 L18.750 2.855 L20.312 1.615 L21.875 0.721 L23.438 0.181 L25.000 0.000 L26.562 0.181 L28.125 0.721 L29.688 1.615 L31.250 2.855 L32.812 4.428 L34.375 6.320 L35.938 8.512 L37.500 10.983 L39.062 13.710 L40.625 16.666 L42.188 19.823 L43.750 23.149 L45.312 26.614 L46.875 30.184 L48.438 33.824 L50.000 37.500 L51.562 41.176 L53.125 44.816 L54.688 48.386 L56.250 51.851 L57.812 55.177 L59.375 58.334 L60.938 61.290 L62.500 64.017 L64.062 66.488 L65.625 68.680 L67.188 70.572 L68.750 72.145 L70.312 73.385 L71.875 74.279 L73.438 74.819 L75.000 75.000 L76.562 74.819 L78.125 74.279 L79.688 73.385 L81.250 72.145 L82.812 70.572 L84.375 68.680 L85.938 66.488 L87.500 64.017 L89.062 61.290 L90.625 58.334 L92.188 55.177 L93.750 51.851 L95.312 48.386 L96.875 44.816 L98.438 41.176 L100.000 37.500',
    lineCap: 'round',
    lineJoin: 'round',
  },
  {
    waveform: 'triangle',
    label: 'Triangle',
    path: 'M0 75 L50 0 L100 75',
    lineCap: 'round',
    lineJoin: 'round',
  },
  {
    waveform: 'saw',
    label: 'Sawtooth',
    path: 'M4.500 70.500 L95.500 4.500 V70.500',
    lineCap: 'butt',
    lineJoin: 'miter',
  },
  {
    waveform: 'square',
    label: 'Square',
    path: 'M0 0 H50 V75 H100',
    lineCap: 'round',
    lineJoin: 'round',
  },
];

// =================== LFOSlider component ===================

export type LFOSliderMode = 'auto' | 'manual' | 'lfo' | 'external';

export interface LFOSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  width?: number | string;
  drawerLines?: [number, number];
  leftColor?: string;
  rightColor?: string;
  border?: SliderBorder;
  fontSize?: number;
  drawerHandle?: boolean;
  drawerFeatureEnabled?: boolean;
  phase?: number;
  mode?: LFOSliderMode;
  lfo?: LfoSettings;
  readExternal?: () => number | undefined | null;
  mirrorToStore?: MirrorFn;
  mirrorEveryMs?: number;
  epsilon?: number;
  onUserChange?: (v: number) => void;
  onAnimatedUpdate?: (v: number) => void;
  onDrawerOpenChange?: (open: boolean) => void;
  onDrawerLinesChange?: (lines: [number, number]) => void;
  onLfoEnabledChange?: (enabled: boolean) => void;
  onWaveformChange?: (waveform: Waveform) => void;
  onFrequencyChange?: (frequency: number) => void;
  onPhaseChange?: (phase: number) => void;
  initialWaveform?: Waveform;
  initialFrequency?: number;
  initialPhase?: number;
  columnDrawerOpen?: boolean;
  columnLfoEnabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function LFOSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  width,
  drawerLines,
  leftColor,
  rightColor,
  border = 'left',
  fontSize,
  drawerHandle = false,
  drawerFeatureEnabled = true,
  phase = 0,
  mode = 'auto',
  lfo: lfoProp,
  readExternal,
  mirrorToStore,
  mirrorEveryMs = 16,
  epsilon = 1e-3,
  onUserChange,
  onAnimatedUpdate,
  onDrawerOpenChange,
  onDrawerLinesChange,
  onLfoEnabledChange,
  onWaveformChange,
  onFrequencyChange,
  onPhaseChange,
  initialWaveform,
  initialFrequency,
  initialPhase,
  columnDrawerOpen,
  columnLfoEnabled = true,
  className,
  style,
}: LFOSliderProps) {
  const precInit = precisionFrom(min, max, step);
  const [text, setText] = useState<string>(() => (defaultValue !== undefined ? Number(defaultValue).toFixed(precInit) : '0'));
  const lfoSettings = useMemo<LfoSettings>(() => {
    const defaults: LfoSettings = {
      enabled: true,
      frequency: initialFrequency ?? 0.5,
      depth: 1,
      offset: 0.5,
      waveform: initialWaveform ?? 'sine',
      phase,
      invert: false,
    };
    return { ...defaults, ...(lfoProp ?? {}) };
  }, [initialFrequency, initialWaveform, lfoProp, phase]);
  const defaultWaveform = initialWaveform ?? lfoSettings.waveform ?? 'sine';
  const drawerHandleActive = drawerHandle && drawerFeatureEnabled;

  // Selection model
  const [selStart, setSelStart] = useState<number>(text.length);
  const [selEnd, setSelEnd] = useState<number>(text.length);
  const [focused, setFocused] = useState<boolean>(false);
  const [blinkOn, setBlinkOn] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverInside, setHoverInside] = useState<boolean>(false);
  const [overHandle, setOverHandle] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerHeight, setDrawerHeight] = useState<number>(0);
  const [activeWaveform, setActiveWaveform] = useState<Waveform>(defaultWaveform);
  const [lfoEnabled, setLfoEnabled] = useState<boolean>(columnLfoEnabled ?? lfoSettings.enabled ?? true);
  const [knobFrequency, setKnobFrequency] = useState<number>(initialFrequency ?? lfoSettings.frequency ?? 0.5);
  const [phaseDial, setPhaseDial] = useState<number>(initialPhase ?? lfoSettings.phase ?? 0);

  useEffect(() => {
    if (!drawerHandleActive && drawerOpen) {
      setDrawerOpen(false);
      setActiveDrawerValue(null);
    }
  }, [drawerHandleActive, drawerOpen]);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const draggingDrawerLineRef = useRef<number | null>(null);
  const drawerPointerCaptureRef = useRef<{ id: number; node: Element | null }>({ id: -1, node: null });
  const [drawerLineValues, setDrawerLineValues] = useState<[number, number]>(() => (
    drawerLines ? [...drawerLines] as [number, number] : [
      valueFromSplit(Math.random(), min, max, step),
      valueFromSplit(Math.random(), min, max, step),
    ]
  ));
  const [drawerLineRatios, setDrawerLineRatios] = useState<[number, number]>(() => ([
    splitFromValue(drawerLines?.[0] ?? drawerLineValues[0], min, max),
    splitFromValue(drawerLines?.[1] ?? drawerLineValues[1], min, max),
  ]));
  const drawerLineRatiosRef = useRef<[number, number]>([
    splitFromValue(drawerLines?.[0] ?? drawerLineValues[0], min, max),
    splitFromValue(drawerLines?.[1] ?? drawerLineValues[1], min, max),
  ]);
  const draggingSplitRef = useRef<boolean>(false);
  const extendActiveRef = useRef<boolean>(false);
  const anchorRef = useRef<number>(selEnd);
  useEffect(() => {
    drawerLineRatiosRef.current = drawerLineRatios;
  }, [drawerLineRatios]);
  useEffect(() => {
    setDrawerLineValues((prev) => {
      const leftRatio = splitFromValue(prev[0], min, max);
      const rightRatio = splitFromValue(prev[1], min, max);
      return [
        valueFromSplit(leftRatio, min, max, step),
        valueFromSplit(rightRatio, min, max, step),
      ];
    });
  }, [min, max, step]);
  useEffect(() => {
    if (!drawerLines) return;
    setDrawerLineValues((prev) => {
      if (Math.abs(prev[0] - drawerLines[0]) < 1e-6 && Math.abs(prev[1] - drawerLines[1]) < 1e-6) {
        return prev;
      }
      return [...drawerLines] as [number, number];
    });
  }, [drawerLines]);
  useEffect(() => {
    if (draggingDrawerLineRef.current !== null) return;
    const next: [number, number] = [
      splitFromValue(drawerLineValues[0], min, max),
      splitFromValue(drawerLineValues[1], min, max),
    ];
    setDrawerLineRatios((prev) => {
      if (Math.abs(prev[0] - next[0]) < 1e-6 && Math.abs(prev[1] - next[1]) < 1e-6) return prev;
      drawerLineRatiosRef.current = next;
      return next;
    });
  }, [drawerLineValues, min, max]);

  // Divider position (0..1) linked to numeric value
  const [split, setSplit] = useState<number>(() => splitFromValue(Number(defaultValue ?? text), min, max));
  const splitRef = useRef(split);

  // Refs
  const textRef = useRef(text);
  const selRef = useRef({ start: selStart, end: selEnd });
  const dragAnchorRef = useRef<number>(selStart);
  const preEditTextRef = useRef<string>(text);
  const editingRef = useRef<boolean>(false);
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { splitRef.current = split; }, [split]);
  useEffect(() => { selRef.current = { start: selStart, end: selEnd }; }, [selStart, selEnd]);
  const liveValueRef = useRef<number>(valueFromSplit(splitRef.current, min, max, step));
  const displayValueRef = useRef<string>(liveValueRef.current.toFixed(precInit));
  const activeDrawerValueRef = useRef<number | null>(null);
  const phaseOffsetRef = useRef(0);
  const lastEmitMsRef = useRef(0);
  const lastNowSecRef = useRef(0);

  // DOM refs
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const valueWrapRef = useRef<HTMLDivElement | null>(null);
  charRefs.current.length = text.length + 1;
  const appliedFontSize = fontSize ?? 16;

  // Caret metrics — 70% of bar height
  const [caretH, setCaretH] = useState<number>(0);
  const [caretLeft, setCaretLeft] = useState<number>(0);
  const recomputeCaretH = useCallback(() => {
    const host = containerRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const h = r.height || parseFloat(getComputedStyle(host as Element).height) || 0;
    const caretPx = h ? Math.max(1, Math.round(h * 0.7)) : 0; // 70% of bar height
    if (caretPx && caretPx !== caretH) setCaretH(caretPx);
  }, [caretH]);
  useLayoutEffect(() => { recomputeCaretH(); }, [recomputeCaretH, text, width]);
  useLayoutEffect(() => {
    if (focused && selStart === selEnd) {
      const host = containerRef.current;
      const node = charRefs.current[selEnd] || charRefs.current[text.length];
      if (host && node) {
        const nr = node.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        setCaretLeft(nr.left - hr.left);
        return;
      }
      // Fallback for empty text before refs settle: align to the right edge of the value wrapper minus padding
      const wrap = valueWrapRef.current;
      if (host && wrap) {
        const wr = wrap.getBoundingClientRect();
        const pr = parseFloat(getComputedStyle(wrap).paddingRight || '0');
        const hr = host.getBoundingClientRect();
        setCaretLeft(wr.right - hr.left - pr);
      }
    }
  }, [focused, selStart, selEnd, text, split, width]);
  useEffect(() => {
    const onResize = () => recomputeCaretH();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recomputeCaretH]);
  useLayoutEffect(() => {
    if (!drawerHandleActive) return;
    const updateDrawerHeight = () => {
      const host = containerRef.current;
      if (host) {
        const rect = host.getBoundingClientRect();
        setDrawerHeight(rect.height);
      }
    };
    updateDrawerHeight();
    window.addEventListener('resize', updateDrawerHeight);
    return () => window.removeEventListener('resize', updateDrawerHeight);
  }, [drawerHandleActive, drawerOpen, appliedFontSize, text, width]);

  const drawerLineSplits = drawerLineRatios;
  const { min: drawerValueMin, max: drawerValueMax } = useMemo(() => {
    if (!drawerHandleActive) return { min, max };
    const valueA = valueFromSplit(drawerLineRatios[0], min, max, step);
    const valueB = valueFromSplit(drawerLineRatios[1], min, max, step);
    const low = Math.min(valueA, valueB);
    const high = Math.max(valueA, valueB);
    return {
      min: clamp(low, min, max),
      max: clamp(high, min, max),
    };
  }, [drawerHandleActive, drawerLineRatios, min, max, step]);

  // Theme colors
  const fallbackLeft = '#2f2f2f';
  const fallbackRight = '#f0f0f0';
  const bgLeft = leftColor ?? fallbackLeft;
  const bgRight = rightColor ?? fallbackRight;
  const textLeft = bgRight;
  const textRight = bgLeft;
  const gradient = useMemo(
    () => `linear-gradient(90deg, ${bgLeft} 0%, ${bgLeft} var(--splitPct), ${bgRight} var(--splitPct), ${bgRight} 100%)`,
    [bgLeft, bgRight],
  );
  const padY = '0.35em';
  const padRight = '0.5rem';
  const infoPaddingY = 1; // px padding around readout text
  const infoPaddingX = 6; // px horizontal padding around readout text
  const infoBorderWidth = 1; // px border width around readout blocks
  const actionBarPadY = `calc(${padY} - ${(infoPaddingY + infoBorderWidth)}px)`;
  const handleSize = Math.max(10, Math.round(appliedFontSize));
  const handleOffset = drawerHandleActive ? Math.max(3, Math.round(handleSize / 3)) : 0;
  const padLeft = drawerHandleActive ? `${handleOffset + handleSize + handleOffset}px` : '0.5rem';
  const actionGapValuePx = drawerHandleActive ? handleOffset : 8;
  const actionGap = `${actionGapValuePx}px`;
  const actionGapWide = `${actionGapValuePx * 2}px`;
  const sliderBorderRadius = drawerHandleActive && drawerOpen ? '3px 3px 0 0' : '3px';
  const showBorder = border !== 'none';
  const outerBorderColor = border === 'right' ? bgRight : bgLeft;
  const resolvedOuterColor = border === 'none' ? 'transparent' : outerBorderColor;
  const sliderStyle = drawerHandleActive && drawerOpen
    ? {
      width: '100%',
      backgroundImage: gradient,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      backgroundOrigin: 'padding-box' as const,
      borderRadius: sliderBorderRadius,
      borderTop: showBorder ? `1px solid ${outerBorderColor}` : '1px solid transparent',
      borderLeft: `1px solid ${resolvedOuterColor}`,
      borderRight: `1px solid ${resolvedOuterColor}`,
      borderBottom: `1px solid ${bgRight}`,
      boxShadow: showBorder ? 'none' : 'inset 0 0 0 1px rgba(0,0,0,0)',
      backgroundClip: 'padding-box',
      boxSizing: 'border-box' as const,
      touchAction: 'none' as const,
    }
    : {
      width: '100%',
      backgroundImage: gradient,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      backgroundOrigin: 'padding-box' as const,
      borderRadius: sliderBorderRadius,
      border: `1px solid ${resolvedOuterColor}`,
      boxShadow: showBorder ? 'none' : '0 0 0 1px rgba(0,0,0,0)',
      backgroundClip: 'padding-box',
      boxSizing: 'border-box' as const,
      touchAction: 'none' as const,
    };
  const iconSize = handleSize - 2; // fill button interior minus borders
  const iconStrokeWidth = 18;
  const infoFontSize = (fontSize ?? 16);
  const formatFrequency = (value: number) => value.toFixed(2).padStart(5, ' ');
  const formatPhase = (value: number) => `${(value / Math.PI).toFixed(2).padStart(5, ' ')}π`;
  const handleFrequencyChange = useCallback((next: number) => {
    setKnobFrequency(next);
    onFrequencyChange?.(next);
  }, [onFrequencyChange]);
  const handlePhaseChange = useCallback((next: number) => {
    setPhaseDial(next);
    onPhaseChange?.(next);
  }, [onPhaseChange]);
  const FREQUENCY_MIN = 0.1;
  const FREQUENCY_MAX = 2;
  const FREQUENCY_STEP = 0.01;
  const PHASE_MIN = 0;
  const PHASE_MAX = Math.PI * 2;
  const PHASE_STEP = Math.PI / 100;
  const [measuredWidth, setMeasuredWidth] = useState<number>(() => (
    typeof width === 'number' ? width : Number(width) || 0
  ));

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.contentRect.width;
      setMeasuredWidth((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const targetWidthPx = typeof width === 'number' ? width : Number(width) || 0;
  const effectiveWidthPx = Math.max(measuredWidth || targetWidthPx, 0);
  const handleLeftRatio = drawerHandleActive ? clamp(handleOffset / Math.max(effectiveWidthPx, 1), 0, 1) : 0;
  const handleRightRatio = drawerHandleActive ? clamp((handleOffset + handleSize) / Math.max(effectiveWidthPx, 1), 0, 1) : 0;
  const handleSpanRatio = Math.max(handleRightRatio - handleLeftRatio, 1 / Math.max(effectiveWidthPx, 1, 1000));
  const handleSplitLocal = drawerHandleActive
    ? clamp((split - handleLeftRatio) / Math.max(handleSpanRatio, Number.EPSILON), 0, 1)
    : 0;
  const handleSplitPct = (handleSplitLocal * 100).toFixed(3);
  const writeSplitVars = useCallback((ratio: number) => {
    const host = containerRef.current;
    if (!host) return;
    host.style.setProperty('--split', ratio.toFixed(6));
    host.style.setProperty('--splitPct', `${(ratio * 100).toFixed(3)}%`);
    if (drawerHandleActive) {
      const span = Math.max(handleSpanRatio, Number.EPSILON);
      const local = clamp((ratio - handleLeftRatio) / span, 0, 1);
      host.style.setProperty('--handleSplitPct', `${(local * 100).toFixed(3)}%`);
    }
  }, [drawerHandleActive, handleLeftRatio, handleSpanRatio]);
  const reflectValueToDom = useCallback((numeric: number, formatted: string) => {
    liveValueRef.current = numeric;
    if (activeDrawerValueRef.current !== null) return;
    displayValueRef.current = formatted;
  }, []);
  const [activeDrawerValue, setActiveDrawerValue] = useState<number | null>(null);
  const precision = useMemo(() => precisionFrom(min, max, step), [min, max, step]);
  const formattedDrawerValue = useMemo(() => {
    if (activeDrawerValue === null || !Number.isFinite(activeDrawerValue)) return null;
    return activeDrawerValue.toFixed(precision);
  }, [activeDrawerValue, precision]);
  const displayValue = formattedDrawerValue ?? (focused ? text : displayValueRef.current);
  const setDrawerLineRatio = useCallback((index: number, ratio: number) => {
    setDrawerLineRatios((prev) => {
      if (Math.abs(prev[index] - ratio) < 1e-6) return prev;
      const next = [...prev] as [number, number];
      next[index] = ratio;
      drawerLineRatiosRef.current = next;
      return next;
    });
  }, []);
  const getDrawerRatioFromClientX = useCallback((clientX: number) => {
    if (!drawerRef.current) return null;
    const rect = drawerRef.current.getBoundingClientRect();
    if (!rect.width) return null;
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }, []);
  const handleDrawerLinePointerDown = useCallback((index: number) => (
    e: React.PointerEvent<HTMLSpanElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    draggingDrawerLineRef.current = index;
    drawerPointerCaptureRef.current = { id: e.pointerId, node: e.currentTarget };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const ratio = getDrawerRatioFromClientX(e.clientX);
    if (ratio !== null) {
      setDrawerLineRatio(index, ratio);
      const snapped = valueFromSplit(ratio, min, max, step);
      setActiveDrawerValue(snapped);
    } else {
      setActiveDrawerValue(drawerLineValues[index]);
    }
  }, [drawerLineValues, getDrawerRatioFromClientX, max, min, setDrawerLineRatio, step]);
  const handleDrawerLinePointerMove = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    const activeIndex = draggingDrawerLineRef.current;
    if (activeIndex === null) return;
    e.preventDefault();
    e.stopPropagation();
    const ratio = getDrawerRatioFromClientX(e.clientX);
    if (ratio === null) return;
    setDrawerLineRatio(activeIndex, ratio);
    const snapped = valueFromSplit(ratio, min, max, step);
    setActiveDrawerValue(snapped);
  }, [getDrawerRatioFromClientX, max, min, setDrawerLineRatio, step]);
  const finishDrawerDrag = useCallback((clientX: number | null) => {
    const index = draggingDrawerLineRef.current;
    if (index === null) return;
    let ratio = clientX === null ? null : getDrawerRatioFromClientX(clientX);
    if (ratio !== null) {
      setDrawerLineRatio(index, ratio);
    } else {
      ratio = drawerLineRatiosRef.current[index];
    }
    const ratioForSnap = ratio ?? drawerLineRatiosRef.current[index];
    const snappedValue = valueFromSplit(ratioForSnap, min, max, step);
    const snappedRatio = splitFromValue(snappedValue, min, max);
    setDrawerLineRatio(index, snappedRatio);
    setDrawerLineValues((prev) => {
      if (Math.abs(prev[index] - snappedValue) < 1e-6) return prev;
      const next = [...prev] as [number, number];
      next[index] = snappedValue;
      onDrawerLinesChange?.(next);
      return next;
    });
    const capture = drawerPointerCaptureRef.current;
    if (capture.node) {
      capture.node.releasePointerCapture?.(capture.id);
    }
    setActiveDrawerValue(null);
    draggingDrawerLineRef.current = null;
    drawerPointerCaptureRef.current = { id: -1, node: null };
  }, [getDrawerRatioFromClientX, max, min, onDrawerLinesChange, setDrawerLineRatio, setDrawerLineValues, step]);
  const handleDrawerLinePointerUp = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    finishDrawerDrag(e.clientX);
  }, [finishDrawerDrag]);
  const handleDrawerLinePointerCancel = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    finishDrawerDrag(null);
  }, [finishDrawerDrag]);

  // Helpers
  const hasSelection = selStart !== selEnd;
  const caret = selEnd;
  const setSelection = (a: number, b: number) => {
    const [s, e] = normalizeSelection(a, b, text.length);
    setSelStart(s);
    setSelEnd(e);
  };
  const linkSplitToText = (val: string) => {
    const num = Number(val);
    if (!isFinite(num)) return;
    const ratio = splitFromValue(num, min, max);
    splitRef.current = ratio;
    writeSplitVars(ratio);
    setSplit(ratio);
  };
  const adjustValueByStep = (dir: -1 | 1) => {
    const current = Number(textRef.current);
    const numeric = Number.isFinite(current) ? current : min;
    const stepValue = step > 0 && Number.isFinite(step) ? step : 1;
    const target = numeric + stepValue * dir;
    const clamped = clamp(target, min, max);
    const snapped = snapToStep(clamped, min, step);
    const formatted = snapped.toFixed(precision);
    const pos = formatted.length;
    const ratio = splitFromValue(snapped, min, max);
    textRef.current = formatted;
    selRef.current = { start: pos, end: pos };
    setText(formatted);
    setSelStart(pos);
    setSelEnd(pos);
    splitRef.current = ratio;
    writeSplitVars(ratio);
    reflectValueToDom(snapped, formatted);
    setSplit(ratio);
    onUserChange?.(snapped);
    editingRef.current = true;
  };
  const applyWaveValue = useCallback((value: number, nowSec?: number) => {
    const lower = drawerValueMin;
    const upper = drawerValueMax;
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return;
    if (upper < lower) return;
    const raw = clamp(value, lower, upper);
    const snapped = snapToStep(raw, min, step);
    const formatted = snapped.toFixed(precision);
    const caretPos = formatted.length;
    const shouldSyncText = focused || editingRef.current;
    reflectValueToDom(snapped, formatted);
    if (shouldSyncText) {
      if (textRef.current !== formatted) {
        textRef.current = formatted;
        setText(formatted);
      }
      if (selRef.current.start !== caretPos || selRef.current.end !== caretPos) {
        selRef.current = { start: caretPos, end: caretPos };
        setSelStart(caretPos);
        setSelEnd(caretPos);
      }
    } else {
      textRef.current = formatted;
    }
    const rawSplit = splitFromValue(raw, min, max);
    if (Number.isFinite(rawSplit) && Math.abs(rawSplit - splitRef.current) > 1e-5) {
      splitRef.current = rawSplit;
      writeSplitVars(rawSplit);
      if (shouldSyncText) setSplit(rawSplit);
    }
    if (onAnimatedUpdate && nowSec !== undefined) {
      const nowMs = nowSec * 1000;
      if (nowMs - lastEmitMsRef.current >= 16) {
        lastEmitMsRef.current = nowMs;
        onAnimatedUpdate(snapped);
      }
    }
  }, [drawerValueMin, drawerValueMax, focused, max, min, onAnimatedUpdate, precision, reflectValueToDom, step, writeSplitVars]);

  const frameFn = useCallback((nowSec: number) => {
    if (!drawerFeatureEnabled) return;
    lastNowSecRef.current = nowSec;
    if (!Number.isFinite(drawerValueMin) || !Number.isFinite(drawerValueMax)) return;
    const activeMode = mode === 'auto'
      ? (lfoSettings.enabled && lfoEnabled ? 'lfo' : (readExternal ? 'external' : 'manual'))
      : (mode === 'lfo' && !lfoEnabled ? 'manual' : mode);
    if (draggingSplitRef.current || editingRef.current) return;
    let nextVal: number | undefined;
    if (activeMode === 'lfo' && lfoSettings.enabled && lfoEnabled) {
      const phaseBase = phaseDial + phaseOffsetRef.current;
      const withPhase: LfoSettings = {
        ...lfoSettings,
        phase: phaseBase,
        waveform: activeWaveform,
        frequency: knobFrequency,
      };
      nextVal = lfoValue(withPhase, nowSec, drawerValueMin, drawerValueMax);
    } else if (activeMode === 'external' && readExternal) {
      const external = readExternal();
      if (typeof external === 'number') {
        nextVal = clamp(external, drawerValueMin, drawerValueMax);
      }
    }
    if (nextVal === undefined) return;
    applyWaveValue(nextVal, nowSec);
  }, [activeWaveform, applyWaveValue, drawerFeatureEnabled, drawerValueMax, drawerValueMin, knobFrequency, phaseDial, lfoEnabled, lfoSettings, mode, readExternal]);
  useFrame(drawerFeatureEnabled ? frameFn : null);
  const readLiveValue = useCallback(
    () => valueFromSplit(splitRef.current, min, max, step),
    [max, min, step],
  );
  useStoreMirror(
    readLiveValue,
    mirrorToStore,
    mirrorEveryMs,
    epsilon,
  );
  useEffect(() => {
    writeSplitVars(splitRef.current);
  }, [writeSplitVars]);
  useEffect(() => {
    const numeric = valueFromSplit(splitRef.current, min, max, step);
    const formatted = numeric.toFixed(precision);
    reflectValueToDom(numeric, formatted);
  }, [min, max, precision, reflectValueToDom, step]);
  useEffect(() => {
    activeDrawerValueRef.current = activeDrawerValue;
    if (formattedDrawerValue !== null) {
      displayValueRef.current = formattedDrawerValue;
    } else {
      displayValueRef.current = liveValueRef.current.toFixed(precision);
    }
  }, [activeDrawerValue, formattedDrawerValue, precision]);
  useEffect(() => {
    phaseOffsetRef.current = 0;
  }, [activeWaveform, knobFrequency, phaseDial, lfoSettings.depth, lfoSettings.offset]);

  useEffect(() => {
    setKnobFrequency(lfoSettings.frequency ?? 0.5);
  }, [lfoSettings.frequency]);

  useEffect(() => {
    setPhaseDial(initialPhase ?? lfoSettings.phase ?? 0);
  }, [initialPhase, lfoSettings.phase]);
  useEffect(() => {
    if (columnLfoEnabled === undefined) return;
    setLfoEnabled(columnLfoEnabled);
  }, [columnLfoEnabled]);
  useEffect(() => {
    if (!drawerFeatureEnabled) {
      setLfoEnabled(false);
    }
  }, [drawerFeatureEnabled]);
  useEffect(() => {
    if (columnDrawerOpen === undefined) return;
    setDrawerOpen(columnDrawerOpen);
    if (!columnDrawerOpen) {
      setActiveDrawerValue(null);
    }
  }, [columnDrawerOpen]);
  const toggleDrawer = () => {
    if (!drawerHandleActive) return;
    setDrawerOpen((prev) => {
      const next = !prev;
      onDrawerOpenChange?.(next);
      return next;
    });
    setActiveDrawerValue(null);
    editingRef.current = false;
    setFocused(false);
    setIsDragging(false);
    extendActiveRef.current = false;
    containerRef.current?.blur();
    const capture = drawerPointerCaptureRef.current;
    if (capture.node) {
      capture.node.releasePointerCapture?.(capture.id);
    }
    draggingDrawerLineRef.current = null;
    drawerPointerCaptureRef.current = { id: -1, node: null };
  };

  // caret blink
  useEffect(() => {
    if (!focused || hasSelection) return;
    setBlinkOn(true);
    const id = setInterval(() => setBlinkOn((s) => !s), 500);
    return () => clearInterval(id);
  }, [focused, hasSelection]);

  const xToIndex = (clientX: number) => {
    const rects: Array<{ x: number; index: number }> = [];
    for (let i = 0; i <= text.length; i++) {
      const el = charRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      rects.push({ x: r.left, index: i });
    }
    if (!rects.length) return 0;
    let best = rects[0];
    let bestDist = Math.abs(clientX - rects[0].x);
    for (let i = 1; i < rects.length; i++) {
      const d = Math.abs(clientX - rects[i].x);
      if (d < bestDist) { best = rects[i]; bestDist = d; }
    }
    return best.index;
  };
  const getTextXBounds = () => {
    const first = charRefs.current[0];
    const endSentinel = charRefs.current[text.length];
    if (!first || !endSentinel) return null;
    const left = first.getBoundingClientRect().left;
    const right = endSentinel.getBoundingClientRect().left;
    return left <= right ? { left, right } : { left: right, right: left };
  };
  const clickIsInsideText = (clientX: number) => {
    const b = getTextXBounds();
    if (!b) return false;
    return clientX >= b.left && clientX <= b.right;
  };
  const getSplitFromX = (clientX: number) => {
    const host = containerRef.current;
    if (!host) return split;
    const r = host.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    return clamp(pct, 0, 1);
  };
  const isOnHandle = (clientX: number, radiusPx: number = 12) => {
    const host = containerRef.current;
    if (!host) return false;
    const r = host.getBoundingClientRect();
    const handleX = r.left + r.width * split;
    return Math.abs(clientX - handleX) <= radiusPx;
  };

  // Edit operations
  const replaceSelection = (insertStr: string) => {
    const baseText = textRef.current;
    const { start, end } = selRef.current;
    const { next, pos } = applyReplace(baseText, start, end, insertStr);
    textRef.current = next;
    selRef.current = { start: pos, end: pos };
    setText(next);
    setSelStart(pos);
    setSelEnd(pos);
    linkSplitToText(next);
  };
  const insert = (s: string) => replaceSelection(s);
  const backspace = () => {
    if (hasSelection) { replaceSelection(''); return; }
    if (selStart === 0) return;
    const pos = selStart - 1;
    const next = text.slice(0, selStart - 1) + text.slice(selStart);
    textRef.current = next;
    setText(next);
    setSelection(pos, pos);
    linkSplitToText(next);
  };
  const del = () => {
    if (hasSelection) { replaceSelection(''); return; }
    if (selStart >= text.length) return;
    const next = text.slice(0, selStart) + text.slice(selStart + 1);
    textRef.current = next;
    setText(next);
    setSelection(selStart, selStart);
    linkSplitToText(next);
  };

  // Keyboard (with proper extend anchor)
  const moveCollapsed = (dir: -1 | 1) => {
    extendActiveRef.current = false;
    const base = hasSelection ? (dir < 0 ? Math.min(selStart, selEnd) : Math.max(selStart, selEnd)) : selEnd;
    const pos = Math.max(0, Math.min(text.length, base + dir));
    setSelection(pos, pos);
    anchorRef.current = pos;
  };
  const moveExtend = (dir: -1 | 1) => {
    if (!extendActiveRef.current) {
      extendActiveRef.current = true;
      if (hasSelection) {
        anchorRef.current = dir < 0 ? Math.max(selStart, selEnd) : Math.min(selStart, selEnd);
      } else {
        anchorRef.current = selEnd;
      }
    }
    const [s, e] = extendStep(anchorRef.current, selStart, selEnd, dir, text.length);
    setSelection(s, e);
  };
  const moveToBoundary = (toStart: boolean, extend: boolean) => {
    if (extend) {
      if (!extendActiveRef.current) {
        extendActiveRef.current = true;
        anchorRef.current = toStart ? Math.max(selStart, selEnd) : Math.min(selStart, selEnd);
      }
      const head = toStart ? 0 : text.length;
      setSelection(anchorRef.current, head);
    } else {
      extendActiveRef.current = false;
      const pos = toStart ? 0 : text.length;
      setSelection(pos, pos);
      anchorRef.current = pos;
    }
  };
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!focused) return;
    if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSelection(0, text.length); return; }
    if (e.key.length === 1 && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (isAllowedNumericChar(e.key)) insert(e.key);
      return;
    }
    switch (e.key) {
      case 'Backspace': e.preventDefault(); backspace(); break;
      case 'Delete': e.preventDefault(); del(); break;
      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey || e.altKey) break;
        e.preventDefault();
        adjustValueByStep(1);
        break;
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey || e.altKey) break;
        e.preventDefault();
        adjustValueByStep(-1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          moveExtend(-1);
        } else {
          moveCollapsed(-1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          moveExtend(+1);
        } else {
          moveCollapsed(+1);
        }
        break;
      case 'Home': e.preventDefault(); moveToBoundary(true, e.shiftKey); break;
      case 'End': e.preventDefault(); moveToBoundary(false, e.shiftKey); break;
      case 'Enter':
        e.preventDefault();
        containerRef.current?.blur();
        return;
      default: break;
    }
  };

  // Pointer interactions
  const capturePointer = useCallback((pointerId: number) => {
    containerRef.current?.setPointerCapture?.(pointerId);
  }, []);

  const releasePointer = useCallback((pointerId: number) => {
    containerRef.current?.releasePointerCapture?.(pointerId);
  }, []);

  const onDoubleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const insideText = clickIsInsideText(e.clientX) && text.length > 0;
    if (!insideText) return;
    e.preventDefault();
    containerRef.current?.focus();
    setFocused(true);
    editingRef.current = true;
    preEditTextRef.current = textRef.current;
    setSelection(0, textRef.current.length);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const rawInsideText = clickIsInsideText(e.clientX) && text.length > 0;
    const isTouch = e.pointerType === 'touch';
    const insideText = rawInsideText && !isTouch;
    setHoverInside(insideText);
    const onHandle = !insideText && isOnHandle(e.clientX);
    setOverHandle(onHandle);

    if (onHandle) {
      if (focused) {
        containerRef.current?.blur();
        setFocused(false);
      }
      editingRef.current = false;
      draggingSplitRef.current = true;
      capturePointer(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Clicking outside the text moves divider and begins drag
    if (!insideText) {
      if (focused) {
        containerRef.current?.blur();
        setFocused(false);
      }
      editingRef.current = false;
      const newSplit = getSplitFromX(e.clientX);
      splitRef.current = newSplit;
      writeSplitVars(newSplit);
      setSplit(newSplit);
      const val = valueFromSplit(newSplit, min, max, step);
      const formatted = val.toFixed(precision);
      reflectValueToDom(val, formatted);
      textRef.current = formatted; setText(formatted);
      setSelection(formatted.length, formatted.length);
      onUserChange?.(val);
      draggingSplitRef.current = true;
      capturePointer(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // begin text edit
    preEditTextRef.current = textRef.current; editingRef.current = true;
    containerRef.current?.focus(); setFocused(true);
    const idx = xToIndex(e.clientX); dragAnchorRef.current = idx;
    setIsDragging(true);
    setSelection(idx, idx);
    e.preventDefault();
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const rawInsideText = clickIsInsideText(e.clientX) && text.length > 0;
    const isTouch = e.pointerType === 'touch';
    const insideText = rawInsideText && !isTouch;
    setHoverInside(insideText);
    setOverHandle(!insideText && isOnHandle(e.clientX));

    if (draggingSplitRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const newSplit = getSplitFromX(e.clientX);
      splitRef.current = newSplit;
      writeSplitVars(newSplit);
      setSplit(newSplit);
      const val = valueFromSplit(newSplit, min, max, step);
      const formatted = val.toFixed(precision);
      reflectValueToDom(val, formatted);
      textRef.current = formatted; setText(formatted);
      setSelection(formatted.length, formatted.length);
      onUserChange?.(val);
      return;
    }

    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const idx = xToIndex(e.clientX);
    const [s, ee] = normalizeSelection(dragAnchorRef.current, idx, text.length);
    setSelection(s, ee);
  };
  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (draggingSplitRef.current) {
      draggingSplitRef.current = false;
      releasePointer(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
      setOverHandle(isOnHandle(e.clientX));
      return;
    }
    setIsDragging(false);
    setOverHandle(isOnHandle(e.clientX));
  };

  const onPointerLeave: React.PointerEventHandler<HTMLDivElement> = () => { setHoverInside(false); setOverHandle(false); };
  const onPointerEnter: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const insideText = clickIsInsideText(e.clientX) && text.length > 0;
    setHoverInside(insideText);
    setOverHandle(!insideText && isOnHandle(e.clientX));
  };

  const onFocus: React.FocusEventHandler<HTMLDivElement> = () => {
    preEditTextRef.current = textRef.current;
    editingRef.current = true;
    setFocused(true);
    if (text !== textRef.current) setText(textRef.current);
    const { start, end } = selRef.current;
    setSelection(start, end);
  };

  const onBlur: React.FocusEventHandler<HTMLDivElement> = () => {
    if (editingRef.current && textRef.current.length === 0) {
      const restore = preEditTextRef.current || '';
      setText(restore); setSelection(restore.length, restore.length); textRef.current = restore;
    } else if (editingRef.current) {
      const asNum = Number(textRef.current);
      if (isFinite(asNum)) {
        const clamped = clamp(asNum, min, max);
        const snapped = snapToStep(clamped, min, step);
        const formatted = snapped.toFixed(precision);
        const ratio = splitFromValue(Number(formatted), min, max);
        setText(formatted); setSelection(formatted.length, formatted.length); textRef.current = formatted;
        splitRef.current = ratio;
        writeSplitVars(ratio);
        reflectValueToDom(snapped, formatted);
        setSplit(ratio);
        onUserChange?.(snapped);
      }
    }
    editingRef.current = false; setFocused(false); setIsDragging(false); setHoverInside(false); setOverHandle(false);
    setSelection(textRef.current.length, textRef.current.length);
  };

  // Derived
  const chars = useMemo(() => Array.from(text), [text]);
  const displayChars = useMemo(() => Array.from(displayValue), [displayValue]);
  const caretBorderAt = (index: number) => {
    const el = charRefs.current[index]; const host = containerRef.current;
    const fallback = blinkOn ? `1px solid ${textLeft}` : '1px solid transparent';
    if (!el || !host) return fallback;
    const r = el.getBoundingClientRect(); const hostR = host.getBoundingClientRect();
    const activeSplit = splitRef.current;
    const inRight = r.left >= hostR.left + hostR.width * activeSplit; const col = inRight ? textRight : textLeft;
    return blinkOn ? `1px solid ${col}` : '1px solid transparent';
  };

  const cursorClass = overHandle
    ? 'cursor-col-resize'
    : (hoverInside && text.length > 0 ? 'cursor-text' : 'cursor-col-resize');

  const selectionStart = Math.min(selStart, selEnd);
  const selectionEnd = Math.max(selStart, selEnd);
  const hasActiveSelection = focused && selectionEnd > selectionStart;
  const highlightColorLeft = hexToRGBA(bgRight, 0.36);
  const highlightColorRight = hexToRGBA(bgLeft, 0.36);

  const stackGap = drawerHandleActive ? '0' : '0.25rem';

  const wrapperClassName = ['flex flex-col', className].filter(Boolean).join(' ');
  const resolvedMaxWidth = width == null
    ? undefined
    : typeof width === 'number'
      ? `${width}px`
      : width;

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: resolvedMaxWidth,
    fontSize: appliedFontSize,
    gap: stackGap,
    ...(style ?? {}),
  };

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {/* Slider body */}
      <div
        ref={containerRef}
        role="textbox"
        aria-label={label}
        aria-multiline={false}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerEnter={onPointerEnter}
        onDoubleClick={onDoubleClick}
        onFocus={onFocus}
        className={`relative inline-block select-none outline-none overflow-hidden ${cursorClass}`}
        style={sliderStyle}
      >
        {drawerHandleActive && (
          <div
            className="absolute pointer-events-auto"
            style={{
              left: handleOffset,
              top: '50%',
              transform: 'translateY(-50%)',
              width: handleSize,
              height: handleSize,
              borderRadius: 3,
              overflow: 'hidden',
              zIndex: 40,
              cursor: 'pointer',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDrawer(); }}
            role="button"
            aria-pressed={drawerOpen}
            aria-label={`${label} drawer toggle`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleDrawer();
              }
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `var(--handleSplitPct, ${handleSplitPct}%)`,
                background: textLeft,
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `var(--handleSplitPct, ${handleSplitPct}%)`,
                right: 0,
                background: textRight,
              }}
            />
          </div>
        )}

        {/* BACKGROUND halves using theme */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0" style={{ background: bgLeft, clipPath: `inset(0 calc(100% - var(--splitPct)) 0 0)` }} />
        <div className="absolute inset-0" style={{ background: bgRight, clipPath: `inset(0 0 0 var(--splitPct))` }} />
      </div>

      {/* LABEL and VALUE display (mirrored for color swap) */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 calc(100% - var(--splitPct)) 0 0)` }}>
          <div
            className="absolute inset-0"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${padY} ${padRight} ${padY} ${padLeft}`, lineHeight: '1' }}
          >
            <span style={{ color: textLeft, marginRight: '0.5rem', flexShrink: 0 }}>{label}</span>
            <span
              style={{ color: textLeft, whiteSpace: 'pre', textAlign: 'right', flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}
            >
              {displayChars.map((ch, i) => (
                <span
                  key={`left-display-${i}`}
                  className="inline-block"
                  style={{ background: hasActiveSelection && i >= selectionStart && i < selectionEnd ? highlightColorLeft : 'transparent' }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 var(--splitPct))` }}>
          <div
            className="absolute inset-0"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${padY} ${padRight} ${padY} ${padLeft}`, lineHeight: '1' }}
          >
            <span style={{ color: textRight, marginRight: '0.5rem', flexShrink: 0 }}>{label}</span>
            <span
              style={{ color: textRight, whiteSpace: 'pre', textAlign: 'right', flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}
            >
              {displayChars.map((ch, i) => (
                <span
                  key={`right-display-${i}`}
                  className="inline-block"
                  style={{ background: hasActiveSelection && i >= selectionStart && i < selectionEnd ? highlightColorRight : 'transparent' }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

        {/* INTERACTION LAYER */}
        <div
          ref={valueWrapRef}
          className="text-transparent z-10"
          style={{ display: 'flex', alignItems: 'center', padding: `${padY} ${padRight} ${padY} ${padLeft}`, lineHeight: '1', width: '100%' }}
        >
          <span style={{ flexShrink: 0, marginRight: '0.5rem' }}>{label}</span>
          <span
            className="whitespace-pre"
            style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}
          >
            {activeDrawerValue === null
              ? (
                <>
                  {chars.map((ch, i) => (
                    <span
                      key={i}
                      ref={(el) => { charRefs.current[i] = el; }}
                      className="inline-block"
                    >{ch}</span>
                  ))}
                  <span ref={(el) => { charRefs.current[chars.length] = el; }} />
                </>
              )
              : (
                <span className="inline-block">{formattedDrawerValue ?? ''}</span>
              )}
          </span>

          {/* Absolute overlay caret centered in the bar */}
          {focused && selStart === selEnd && caretH > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute"
              style={{ left: caretLeft, top: '50%', transform: 'translateY(-50%)', height: caretH, borderLeft: caretBorderAt(caret) }}
            />
          )}
        </div>
      </div>
      {drawerHandleActive && drawerOpen && (
      <div
        style={{
          width: '100%',
          marginTop: 0,
      borderLeft: `1px solid ${resolvedOuterColor}`,
      borderRight: `1px solid ${resolvedOuterColor}`,
      borderBottom: `1px solid ${resolvedOuterColor}`,
          borderRadius: '0 0 3px 3px',
          backgroundColor: bgRight,
          backgroundClip: 'padding-box',
          overflow: 'hidden',
          boxSizing: 'border-box' as const,
        }}
      >
          <div
            ref={drawerRef}
            style={{
              position: 'relative',
              height: drawerHeight || undefined,
              borderTop: `1px solid ${bgLeft}`,
              borderBottom: `1px solid ${bgRight}`,
              overflow: 'hidden',
              touchAction: 'none',
            }}
          >
            {(() => {
              const [leftSplit, rightSplit] = drawerLineSplits;
              const normalizedLeft = clamp(Math.min(leftSplit, rightSplit), 0, 1);
              const normalizedRight = clamp(Math.max(leftSplit, rightSplit), 0, 1);
              return (
                <>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: bgLeft,
                      clipPath: `inset(0 ${(100 - normalizedLeft * 100).toFixed(3)}% 0 0)`,
                    }}
                  />
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: bgLeft,
                      clipPath: `inset(0 0 0 ${(normalizedRight * 100).toFixed(3)}%)`,
                    }}
                  />
                </>
              );
            })()}
            {drawerLineSplits.map((ratio, index) => {
              const isActive = draggingDrawerLineRef.current === index;
              const normalizedLeft = clamp(Math.min(drawerLineSplits[0], drawerLineSplits[1]), 0, 1);
              const normalizedRight = clamp(Math.max(drawerLineSplits[0], drawerLineSplits[1]), 0, 1);
              const distToLeft = Math.abs(ratio - normalizedLeft);
              const distToRight = Math.abs(ratio - normalizedRight);
              const isLeftHandle = distToLeft <= distToRight;
              const leftHalfColor = isLeftHandle ? bgRight : bgLeft;
              const rightHalfColor = isLeftHandle ? bgLeft : bgRight;
              return (
                <span
                  key={`drawer-line-${index}`}
                  onPointerDown={handleDrawerLinePointerDown(index)}
                  onPointerMove={handleDrawerLinePointerMove}
                  onPointerUp={handleDrawerLinePointerUp}
                  onPointerCancel={handleDrawerLinePointerCancel}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    bottom: '10%',
                    width: 6,
                    borderRadius: 3,
                    left: `${(ratio * 100).toFixed(3)}%`,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden',
                    cursor: isActive ? 'col-resize' : 'col-resize',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flex: '0 0 50%',
                      background: leftHalfColor,
                      borderRadius: '3px 0 0 3px',
                    }}
                  />
                  <span
                    aria-hidden
                    style={{
                      flex: '0 0 50%',
                      background: rightHalfColor,
                      borderRadius: '0 3px 3px 0',
                    }}
                  />
                </span>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: actionGap,
              padding: `${actionBarPadY} ${padRight} ${actionBarPadY} ${actionGap}`,
              background: bgRight,
              borderTop: `1px solid ${bgLeft}`,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
            }}
          >
            {DRAWER_ICON_DEFS.map((icon) => {
              const isSelectedWaveform = activeWaveform === icon.waveform;
              const isActive = isSelectedWaveform && lfoEnabled;
              const toggleWaveform = () => {
                if (isSelectedWaveform) {
                  setLfoEnabled((enabled) => {
                    const next = !enabled;
                    onLfoEnabledChange?.(next);
                    return next;
                  });
                  return;
                }
                setActiveWaveform(icon.waveform);
                if (activeWaveform !== icon.waveform) {
                  onWaveformChange?.(icon.waveform);
                }
                setLfoEnabled((enabled) => {
                  if (enabled) return enabled;
                  onLfoEnabledChange?.(true);
                  return true;
                });
              };
              return (
                <button
                  key={`drawer-action-${icon.waveform}`}
                  type="button"
                  aria-label={`${icon.label} waveform`}
                  aria-pressed={isActive}
                  style={{
                    width: handleSize,
                    height: handleSize,
                    borderRadius: 3,
                    border: `1px solid ${bgLeft}`,
                    background: isActive ? bgLeft : bgRight,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    color: isActive ? bgRight : bgLeft,
                  }}
                  onClick={toggleWaveform}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 100 75"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    style={{ width: iconSize, height: iconSize, display: 'block' }}
                  >
                    <path
                      d={icon.path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={iconStrokeWidth}
                      strokeLinecap={icon.lineCap}
                      strokeLinejoin={icon.lineJoin}
                    />
                  </svg>
                </button>
              );
            })}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: actionGapWide }}>
              <MiniReadoutSlider
                label={`${label} frequency`}
                value={knobFrequency}
                formatValue={formatFrequency}
                suffix="Hz"
                fontSize={infoFontSize}
                minValueWidthCh={5}
                paddingX={infoPaddingX}
                paddingY={infoPaddingY}
                borderWidth={infoBorderWidth}
                bgLeft={bgLeft}
                bgRight={bgRight}
                min={FREQUENCY_MIN}
                max={FREQUENCY_MAX}
                step={FREQUENCY_STEP}
                onChange={handleFrequencyChange}
              />
              <MiniReadoutSlider
                label={`${label} phase`}
                value={phaseDial}
                formatValue={formatPhase}
                suffix="rad"
                fontSize={infoFontSize}
                minValueWidthCh={5}
                paddingX={infoPaddingX}
                paddingY={infoPaddingY}
                borderWidth={infoBorderWidth}
                bgLeft={bgLeft}
                bgRight={bgRight}
                min={PHASE_MIN}
                max={PHASE_MAX}
                step={PHASE_STEP}
                onChange={handlePhaseChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MiniReadoutSliderProps {
  label: string;
  value: number;
  formatValue: (value: number) => string;
  suffix?: string;
  fontSize: number;
  minValueWidthCh: number;
  paddingX: number;
  paddingY: number;
  borderWidth: number;
  bgLeft: string;
  bgRight: string;
  gap?: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function MiniReadoutSlider({
  label,
  value,
  formatValue,
  suffix,
  fontSize,
  minValueWidthCh,
  paddingX,
  paddingY,
  borderWidth,
  bgLeft,
  bgRight,
  gap = 4,
  min,
  max,
  step = 0,
  onChange,
}: MiniReadoutSliderProps) {
  const valueToRatio = useCallback((val: number) => {
    const span = max - min;
    if (!isFinite(span) || span <= 0) return 0;
    return clamp((val - min) / span, 0, 1);
  }, [min, max]);

  const ratioToValue = useCallback((ratio: number) => {
    const span = max - min;
    if (!isFinite(span) || span <= 0) return clamp(min, min, max);
    const unclamped = min + ratio * span;
    if (!step || step <= 0 || !isFinite(step)) {
      return clamp(unclamped, min, max);
    }
    const steps = Math.round((unclamped - min) / step);
    const snapped = min + steps * step;
    const precision = precisionFrom(min, max, step);
    return clamp(Number(snapped.toFixed(precision)), min, max);
  }, [min, max, step]);

  const [split, setSplit] = useState(() => valueToRatio(value));
  const hostRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setSplit((prev) => {
      const normalized = valueToRatio(value);
      return Math.abs(prev - normalized) < 1e-4 ? prev : normalized;
    });
  }, [value, valueToRatio]);

  const updateFromPointer = useCallback((clientX: number) => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const width = rect.width;
    if (width <= 0) return;
    const next = clamp((clientX - rect.left) / width, 0, 1);
    const snappedValue = ratioToValue(next);
    const snappedRatio = valueToRatio(snappedValue);
    setSplit(snappedRatio);
    onChange(snappedValue);
  }, [ratioToValue, valueToRatio, onChange]);

  const releasePointerCapture = useCallback((pointerId: number) => {
    const host = hostRef.current;
    if (host?.hasPointerCapture?.(pointerId)) host.releasePointerCapture(pointerId);
  }, []);

  const finishInteraction = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = false;
    releasePointerCapture(event.pointerId);
  }, [releasePointerCapture]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    hostRef.current?.setPointerCapture?.(event.pointerId);
    updateFromPointer(event.clientX);
  }, [updateFromPointer]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    updateFromPointer(event.clientX);
  }, [updateFromPointer]);

  const clampedSplit = clamp(split, 0, 1);
  const splitPercent = `${(clampedSplit * 100).toFixed(3)}%`;
  const leftClip = `inset(0 calc(100% - ${splitPercent}) 0 0)`;
  const rightClip = `inset(0 0 0 ${splitPercent})`;
  const seamVisible = clampedSplit > 0 && clampedSplit < 1;
  const textColorLeft = bgRight;
  const textColorRight = bgLeft;
  const display = formatValue(value);
  const hiddenLabel = `${label}: ${display.trim()}${suffix ? ` ${suffix}` : ''}`;
  const cornerRadius = 3;
  const overlayPadding = `${paddingY}px ${paddingX}px`;
  const gradient = `linear-gradient(90deg, ${bgLeft} 0%, ${bgLeft} ${splitPercent}, ${bgRight} ${splitPercent}, ${bgRight} 100%)`;
  const seamWidth = Math.max(borderWidth, 1);

  const valueStyle: React.CSSProperties = {
    fontFeatureSettings: '"tnum"',
    fontSize,
    minWidth: `${minValueWidthCh}ch`,
    textAlign: 'right',
    whiteSpace: 'pre',
  };

  const suffixStyle: React.CSSProperties = {
    fontSize: fontSize * 0.8,
  };

  return (
    <div
      ref={hostRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      onPointerLeave={finishInteraction}
      style={{
        position: 'relative',
        border: `${borderWidth}px solid ${bgLeft}`,
        borderRadius: cornerRadius,
        backgroundImage: gradient,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        backgroundOrigin: 'padding-box',
        backgroundClip: 'padding-box',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'col-resize',
        touchAction: 'none',
        lineHeight: 1,
      }}
    >
      <span style={{ ...visuallyHiddenStyle, pointerEvents: 'none' }}>
        {hiddenLabel}
      </span>
      <div
        aria-hidden
        style={{
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap,
          padding: overlayPadding,
        }}
      >
        <span style={valueStyle}>{display}</span>
        {suffix ? <span style={suffixStyle}>{suffix}</span> : null}
      </div>
      {seamVisible ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: splitPercent,
            width: seamWidth,
            transform: 'translateX(-50%)',
            background: bgLeft,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap,
          padding: overlayPadding,
          color: textColorLeft,
          clipPath: leftClip,
          pointerEvents: 'none',
        }}
      >
        <span style={valueStyle}>{display}</span>
        {suffix ? <span style={suffixStyle}>{suffix}</span> : null}
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap,
          padding: overlayPadding,
          color: textColorRight,
          clipPath: rightClip,
          pointerEvents: 'none',
        }}
      >
        <span style={valueStyle}>{display}</span>
        {suffix ? <span style={suffixStyle}>{suffix}</span> : null}
      </div>
    </div>
  );
}

export default LFOSlider;
