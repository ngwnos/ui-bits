import React from "react";
import "./virtual-keyboard.css";
export interface VirtualKeyboardKey {
    note: string;
    frequency: number;
    position?: number;
}
export interface VirtualKeyboardSoundfont {
    instrument: string;
    soundfont?: string;
    format?: "mp3" | "ogg";
    url?: string;
    monitor?: boolean;
    gain?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    notes?: Array<string | number>;
    destination?: AudioNode;
    context?: AudioContext;
}
export type VirtualKeyboardSoundfontConfig = Omit<VirtualKeyboardSoundfont, "instrument">;
export interface VirtualKeyboardTone {
    destination?: AudioNode;
    context?: AudioContext;
    polyphony?: number;
    volume?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
}
export interface VirtualKeyboardInstrumentOption {
    value: string;
    label: string;
    source?: "tone" | "soundfont";
    soundfontConfig?: VirtualKeyboardSoundfontConfig;
    toneConfig?: VirtualKeyboardTone;
}
export interface VirtualKeyboardSoundfontOption extends VirtualKeyboardSoundfontConfig {
    value: string;
    label: string;
}
export interface VirtualKeyboardControlIds {
    startNote?: string;
    noteCount?: string;
    heightUnits?: string;
    showLabels?: string;
    keyboardShortcutsEnabled?: string;
    instrument?: string;
}
export interface VirtualKeyboardProps {
    whiteKeys?: VirtualKeyboardKey[];
    blackKeys?: VirtualKeyboardKey[];
    startNote?: number | string;
    defaultStartNote?: number | string;
    onStartNoteChange?: (startNote: number | string) => void;
    noteCount?: number;
    defaultNoteCount?: number;
    onNoteCountChange?: (count: number) => void;
    showLabels?: boolean;
    defaultShowLabels?: boolean;
    onShowLabelsChange?: (show: boolean) => void;
    heightUnits?: number;
    defaultHeightUnits?: number;
    onHeightUnitsChange?: (heightUnits: number) => void;
    showControls?: boolean;
    showHeightControl?: boolean;
    instrumentOptions?: VirtualKeyboardInstrumentOption[];
    soundfontOptions?: VirtualKeyboardSoundfontOption[];
    instrument?: string;
    defaultInstrument?: string;
    onInstrumentChange?: (instrument: string) => void;
    toneInstrumentValue?: string;
    instrumentIcon?: React.ReactElement;
    soundfontConfig?: VirtualKeyboardSoundfontConfig | null;
    toneConfig?: VirtualKeyboardTone | null;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    colorA?: string;
    colorB?: string;
    whiteKeyColor?: string;
    blackKeyColor?: string;
    whiteKeyActiveColor?: string;
    blackKeyActiveColor?: string;
    dialIndicatorColor?: string;
    soundfont?: VirtualKeyboardSoundfont | string;
    tone?: VirtualKeyboardTone;
    keyboardShortcutsEnabled?: boolean;
    defaultKeyboardShortcutsEnabled?: boolean;
    onKeyboardShortcutsChange?: (enabled: boolean) => void;
    controlIdPrefix?: string;
    controlIds?: VirtualKeyboardControlIds;
    activeNotes?: Record<string, boolean>;
    onNoteOn?: (note: string, frequency: number) => void;
    onNoteOff?: (note: string) => void;
    className?: string;
    style?: React.CSSProperties;
    fontSize?: number;
    ariaLabel?: string;
}
export declare const DEFAULT_START_NOTE = "C4";
export declare const DEFAULT_NOTE_COUNT = 13;
export declare const DEFAULT_HEIGHT_UNITS = 6;
export declare const DEFAULT_KEYBOARD_SHORTCUTS_ENABLED = false;
export default function VirtualKeyboard({ whiteKeys, blackKeys, startNote, defaultStartNote, onStartNoteChange, noteCount, defaultNoteCount, onNoteCountChange, showLabels, defaultShowLabels, onShowLabelsChange, heightUnits, defaultHeightUnits, onHeightUnitsChange, showControls, showHeightControl, instrumentOptions, soundfontOptions, instrument, defaultInstrument, onInstrumentChange, toneInstrumentValue, instrumentIcon, soundfontConfig, toneConfig, header, footer, colorA, colorB, whiteKeyColor, blackKeyColor, whiteKeyActiveColor, blackKeyActiveColor, dialIndicatorColor, soundfont, tone, keyboardShortcutsEnabled, defaultKeyboardShortcutsEnabled, onKeyboardShortcutsChange, controlIdPrefix, controlIds, activeNotes, onNoteOn, onNoteOff, className, style, fontSize, ariaLabel, }: VirtualKeyboardProps): import("react/jsx-runtime").JSX.Element;
