import React from "react";
import type { LfoSettings, Waveform } from "../../lfo";
import type { MirrorFn } from "../../useStoreMirror";
import { type DisplayFormatterPresetOptions, type DisplayValueFormatterPreset, type FormatDisplayValueFn, type ParseDisplayValueFn } from "./valueFormatters";
import "./lfoslider.css";
export type SliderBorder = 'a' | 'b' | 'none';
export type LFOSliderMode = 'auto' | 'manual' | 'lfo' | 'external';
export type SliderVariant = 'full' | 'basic';
export type SliderBarStyle = 'continuous' | 'discrete' | 'step-aligned';
/**
 * Numeric slider with optional LFO/external modulation controls.
 *
 * State modes:
 * - Controlled: provide `value` and update it in `onUserChange`.
 * - Store-bound: provide `controlId` without controlled `value`.
 * - Uncontrolled: provide `defaultValue`.
 */
export interface LFOSliderProps {
    /** Visible label and auto-id seed when `controlId` is omitted. */
    label: string;
    ariaLabel?: string;
    showLabel?: boolean;
    min?: number;
    max?: number;
    step?: number;
    variant?: SliderVariant;
    barStyle?: SliderBarStyle;
    barSegmentCount?: number;
    /** Initial value for uncontrolled usage. */
    defaultValue?: number;
    /** Controlled value. */
    value?: number;
    width?: number | string;
    drawerLines?: [number, number];
    defaultLfoRange?: [number, number];
    lfoRange?: [number, number];
    lfoFrequencyMin?: number;
    lfoFrequencyMax?: number;
    lfoFrequencyStep?: number;
    audioFrequencyMin?: number;
    audioFrequencyMax?: number;
    audioFrequencyStep?: number;
    colorA?: string;
    colorB?: string;
    border?: SliderBorder;
    fontSize?: number;
    showLfoControls?: boolean;
    phase?: number;
    mode?: LFOSliderMode;
    defaultLfo?: LfoSettings;
    lfo?: LfoSettings;
    readExternal?: () => number | undefined | null;
    mirrorToStore?: MirrorFn;
    mirrorEveryMs?: number;
    epsilon?: number;
    /** Called for direct user edits (typing, dragging, wheel). */
    onUserChange?: (v: number) => void;
    /** Called every frame while animated output changes. */
    onAnimatedUpdate?: (v: number) => void;
    onDrawerOpenChange?: (open: boolean) => void;
    onDrawerLinesChange?: (lines: [number, number]) => void;
    onLfoEnabledChange?: (enabled: boolean) => void;
    onWaveformChange?: (waveform: Waveform) => void;
    onFrequencyChange?: (frequency: number) => void;
    onPhaseChange?: (phase: number) => void;
    defaultWaveform?: Waveform;
    defaultFrequency?: number;
    defaultPhase?: number;
    defaultDrawerOpen?: boolean;
    drawerOpen?: boolean;
    defaultLfoRunning?: boolean;
    lfoRunning?: boolean;
    className?: string;
    style?: React.CSSProperties;
    formatDisplayValue?: FormatDisplayValueFn;
    parseDisplayValue?: ParseDisplayValueFn;
    formatEditingValue?: boolean;
    valuePrefix?: string;
    valueSuffix?: string;
    displayFormatterPreset?: DisplayValueFormatterPreset;
    displayFormatterPresetOptions?: DisplayFormatterPresetOptions;
    audioBins?: readonly number[];
    audioBinCount?: number;
    audioMaxMagnitude?: number;
    defaultAudioResponse?: number;
    onAudioResponseChange?: (value: number) => void;
    defaultAudioSamplePosition?: number;
    onAudioSamplePositionChange?: (value: number) => void;
    borderMask?: Partial<Record<'top' | 'right' | 'bottom' | 'left', boolean>>;
    suspended?: boolean;
    /** Control-store id for the base slider value, used when `value` is uncontrolled. */
    controlId?: string;
    /** Prefix for derived LFO control ids (`.enabled`, `.waveform`, `.frequency`, ...). */
    lfoControlIdPrefix?: string;
}
declare function LFOSlider(props: LFOSliderProps): import("react/jsx-runtime").JSX.Element;
export default LFOSlider;
