import React from "react";
import { MousePointer2, CaseUpper, Piano } from "lucide-react";
import { usePanelTheme } from "../../panelGap";
import { useControlValue, useResolvedControlIdPrefix } from "../../controlStore";
import IconButton from "../IconButton";
import IconDropdown from "../IconDropdown";
import Dial from "../Dial";
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

export const DEFAULT_START_NOTE = "C4";
export const DEFAULT_NOTE_COUNT = 13;
export const DEFAULT_HEIGHT_UNITS = 6;
export const DEFAULT_KEYBOARD_SHORTCUTS_ENABLED = false;
const DEFAULT_TONE_OPTION = "tonejs";
const MIN_SLIDER_UNIT_PX = 18;
const FALLBACK_COLOR_A = "#f2f0e5";
const FALLBACK_COLOR_B = "#1c1b1a";
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK_OFFSETS = new Set([1, 3, 6, 8, 10]);
const WHITE_OFFSETS = new Set([0, 2, 4, 5, 7, 9, 11]);
const MIN_START_MIDI = 21;
const WHITE_MIDI_VALUES = (() => {
  const values: number[] = [];
  for (let midi = 0; midi <= 127; midi += 1) {
    if (WHITE_OFFSETS.has(midi % 12)) {
      values.push(midi);
    }
  }
  return values;
})();
const MIN_START_INDEX = Math.max(0, WHITE_MIDI_VALUES.indexOf(MIN_START_MIDI));

function midiToNoteName(midi: number) {
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${name}${octave}`;
}

function midiToFrequency(midi: number) {
  const rounded = Math.round(midi);
  return 440 * Math.pow(2, (rounded - 69) / 12);
}

function parseNoteName(value: string) {
  const match = value.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return null;
  const [, rawLetter, accidental, rawOctave] = match;
  const letter = rawLetter.toUpperCase();
  const baseIndex = NOTE_NAMES.findIndex((name) => name[0] === letter && name.length === 1);
  if (baseIndex < 0) return null;
  const octave = Number(rawOctave);
  if (!Number.isFinite(octave)) return null;
  let offset = baseIndex;
  if (accidental === "#") offset += 1;
  if (accidental === "b") offset -= 1;
  const normalized = ((offset % 12) + 12) % 12;
  return (octave + 1) * 12 + normalized;
}

function resolveStartMidi(startNote?: number | string) {
  if (typeof startNote === "number" && Number.isFinite(startNote)) {
    const rounded = Math.max(0, Math.min(127, Math.round(startNote)));
    return snapToWhiteMidi(rounded);
  }
  if (typeof startNote === "string") {
    const parsed = parseNoteName(startNote);
    if (parsed != null) {
      const clamped = Math.max(0, Math.min(127, parsed));
      return snapToWhiteMidi(clamped);
    }
  }
  return snapToWhiteMidi(parseNoteName(DEFAULT_START_NOTE) ?? 60);
}

function snapToWhiteMidi(midi: number) {
  let clamped = Math.max(0, Math.min(127, Math.round(midi)));
  while (clamped > 0 && !WHITE_OFFSETS.has(clamped % 12)) {
    clamped -= 1;
  }
  return clamped;
}

function buildKeys(startMidi: number, noteCount: number) {
  const clampedCount = Math.max(1, Math.round(noteCount));
  const whiteKeys: VirtualKeyboardKey[] = [];
  const blackKeys: VirtualKeyboardKey[] = [];
  let whiteIndex = 0;
  for (let i = 0; i < clampedCount; i += 1) {
    const midi = startMidi + i;
    const name = midiToNoteName(midi);
    const frequency = midiToFrequency(midi);
    const pitchClass = ((midi % 12) + 12) % 12;
    if (BLACK_OFFSETS.has(pitchClass)) {
      const position = whiteIndex - 1 + 0.7;
      blackKeys.push({ note: name, frequency, position });
    } else {
      whiteKeys.push({ note: name, frequency });
      whiteIndex += 1;
    }
  }
  return { whiteKeys, blackKeys };
}

function computeSliderUnitPx(fontSize: number) {
  const previewPaddingEm = 0.35;
  const previewPaddingPx = fontSize * previewPaddingEm;
  const previewLineHeight = 1;
  const baseLabelHeight = fontSize * previewLineHeight;
  return Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
    Math.round(fontSize + previewPaddingPx * 1.5),
    MIN_SLIDER_UNIT_PX,
  );
}

const KEYBOARD_SHORTCUTS = [
  "a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j",
  "k", "o", "l", "p", ";", "'", "z", "x", "c", "v", "b", "n",
];

type SoundfontNote = { stop?: (when?: number) => void };
type ToneContextLike = { dispose: () => void };
type ToneSynthLike = {
  triggerAttack: (note: string) => void;
  triggerRelease: (note: string) => void;
  releaseAll: () => void;
  disconnect: () => void;
  dispose: () => void;
  connect: (destination: AudioNode) => void;
  toDestination: () => void;
  volume: { value: number };
  maxPolyphony: number;
};
type ToneModuleLike = {
  start: () => Promise<void>;
  Context: new (options: { context: AudioContext }) => ToneContextLike;
  getContext: () => unknown;
  setContext: (context: unknown) => void;
  PolySynth: new (voice: unknown, options?: { envelope?: unknown }) => ToneSynthLike;
  Synth: unknown;
};
type SoundfontPlayerLike = {
  start: (note: string, when?: number) => SoundfontNote | undefined;
  connect?: (destination: AudioNode) => unknown;
};
type SoundfontModuleLike = {
  instrument: (
    context: AudioContext,
    name: string,
    options?: Record<string, unknown>,
  ) => Promise<SoundfontPlayerLike>;
};

let toneModulePromise: Promise<ToneModuleLike> | null = null;
let soundfontModulePromise: Promise<SoundfontModuleLike> | null = null;

function createMissingAudioDependencyError(dependency: string, error: unknown) {
  const reason = error instanceof Error ? error.message : String(error);
  return new Error(
    `[ui-bits] Missing optional audio dependency "${dependency}". `
    + `Install "${dependency}" to use VirtualKeyboard audio playback. (${reason})`,
  );
}

async function loadToneModule() {
  if (!toneModulePromise) {
    toneModulePromise = import("tone")
      .then((module) => module as unknown as ToneModuleLike);
  }
  return toneModulePromise;
}

async function loadSoundfontModule() {
  if (!soundfontModulePromise) {
    soundfontModulePromise = import("soundfont-player")
      .then((module) => module as unknown as SoundfontModuleLike);
  }
  return soundfontModulePromise;
}

function shouldIgnoreKeyboardEvent(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
}

function useControllableValue<T>(
  value: T | undefined,
  defaultValue: T,
  onChange: ((next: T) => void) | undefined,
  controlId?: string,
) {
  const [storeValue, setStoreValue] = useControlValue<T>(controlId);
  const shouldUseStore = controlId !== undefined && value === undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const resolved = isControlled
    ? value
    : (shouldUseStore ? (storeValue ?? internal) : internal);
  const setValue = React.useCallback((next: T) => {
    if (!isControlled && !shouldUseStore) {
      setInternal(next);
    }
    if (shouldUseStore) {
      setStoreValue(next);
    }
    onChange?.(next);
  }, [isControlled, onChange, setStoreValue, shouldUseStore]);
  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(defaultValue);
  }, [defaultValue, setStoreValue, shouldUseStore, storeValue]);
  return [resolved, setValue] as const;
}

export default function VirtualKeyboard({
  whiteKeys,
  blackKeys,
  startNote,
  defaultStartNote,
  onStartNoteChange,
  noteCount,
  defaultNoteCount,
  onNoteCountChange,
  showLabels,
  defaultShowLabels,
  onShowLabelsChange,
  heightUnits,
  defaultHeightUnits,
  onHeightUnitsChange,
  showControls = true,
  showHeightControl = true,
  instrumentOptions = [],
  soundfontOptions = [],
  instrument,
  defaultInstrument,
  onInstrumentChange,
  toneInstrumentValue = DEFAULT_TONE_OPTION,
  instrumentIcon,
  soundfontConfig,
  toneConfig,
  header,
  footer,
  colorA,
  colorB,
  whiteKeyColor,
  blackKeyColor,
  whiteKeyActiveColor,
  blackKeyActiveColor,
  dialIndicatorColor,
  soundfont,
  tone,
  keyboardShortcutsEnabled,
  defaultKeyboardShortcutsEnabled = DEFAULT_KEYBOARD_SHORTCUTS_ENABLED,
  onKeyboardShortcutsChange,
  controlIdPrefix,
  controlIds,
  activeNotes,
  onNoteOn,
  onNoteOff,
  className,
  style,
  fontSize,
  ariaLabel = "Virtual keyboard",
}: VirtualKeyboardProps) {
  const resolvedControlPrefix = useResolvedControlIdPrefix(controlIdPrefix, ariaLabel);
  const resolveControlId = React.useCallback((key: keyof VirtualKeyboardControlIds) => (
    controlIds?.[key] ?? (resolvedControlPrefix ? `${resolvedControlPrefix}.${key}` : undefined)
  ), [controlIds, resolvedControlPrefix]);
  const startNoteControlId = resolveControlId("startNote");
  const noteCountControlId = resolveControlId("noteCount");
  const heightUnitsControlId = resolveControlId("heightUnits");
  const showLabelsControlId = resolveControlId("showLabels");
  const shortcutsControlId = resolveControlId("keyboardShortcutsEnabled");
  const instrumentControlId = resolveControlId("instrument");
  const [resolvedStartNote, setResolvedStartNote] = useControllableValue(
    startNote,
    defaultStartNote ?? DEFAULT_START_NOTE,
    onStartNoteChange,
    startNoteControlId,
  );
  const [resolvedNoteCount, setResolvedNoteCount] = useControllableValue(
    noteCount,
    defaultNoteCount ?? DEFAULT_NOTE_COUNT,
    onNoteCountChange,
    noteCountControlId,
  );
  const [resolvedHeightUnits, setResolvedHeightUnits] = useControllableValue(
    heightUnits,
    defaultHeightUnits ?? DEFAULT_HEIGHT_UNITS,
    onHeightUnitsChange,
    heightUnitsControlId,
  );
  const [resolvedShowLabels] = useControllableValue(
    showLabels,
    defaultShowLabels ?? false,
    onShowLabelsChange,
    showLabelsControlId,
  );
  const [shortcutsEnabled, setShortcutsEnabled] = useControllableValue(
    keyboardShortcutsEnabled,
    defaultKeyboardShortcutsEnabled,
    onKeyboardShortcutsChange,
    shortcutsControlId,
  );
  const normalizedSoundfontOptions = React.useMemo<VirtualKeyboardInstrumentOption[]>(() => (
    soundfontOptions.map(({ value, label, ...config }) => ({
      value,
      label,
      source: "soundfont" as const,
      soundfontConfig: config,
      toneConfig: undefined,
    }))
  ), [soundfontOptions]);
  const resolvedInstrumentOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return [...instrumentOptions, ...normalizedSoundfontOptions].filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [instrumentOptions, normalizedSoundfontOptions]);
  const [instrumentValue, setInstrumentValue] = useControllableValue(
    instrument,
    defaultInstrument ?? resolvedInstrumentOptions[0]?.value ?? "",
    onInstrumentChange,
    instrumentControlId,
  );
  const pointerStateRef = React.useRef<{ pointerId: number | null; note: string | null }>({
    pointerId: null,
    note: null,
  });
  const pressedKeysRef = React.useRef<Map<string, string>>(new Map());
  const activeNoteKeysRef = React.useRef<Set<string>>(new Set());
  const soundfontStateRef = React.useRef<{
    instrument: SoundfontPlayerLike;
    context: AudioContext;
    destination: AudioNode;
    ownsContext: boolean;
  } | null>(null);
  const toneStateRef = React.useRef<{
    toneModule: ToneModuleLike;
    synth: ToneSynthLike;
    context: AudioContext;
    destination: AudioNode;
    ownsContext: boolean;
    toneContext: ToneContextLike;
  } | null>(null);
  const soundfontNotesRef = React.useRef<Map<string, SoundfontNote>>(new Map());
  const [audioDependencyError, setAudioDependencyError] = React.useState<Error | null>(null);
  const [internalActive, setInternalActive] = React.useState<Record<string, boolean>>({});
  if (audioDependencyError) {
    throw audioDependencyError;
  }
  const resolvedActive = activeNotes ?? internalActive;
  const resolvedNoteCountClamped = Math.max(1, Math.min(88, Math.round(resolvedNoteCount)));
  const derivedKeys = React.useMemo<{
    white: VirtualKeyboardKey[];
    black: VirtualKeyboardKey[];
  }>(() => {
    if (whiteKeys && blackKeys) {
      return { white: whiteKeys, black: blackKeys };
    }
    const startMidiValue = resolveStartMidi(resolvedStartNote);
    const { whiteKeys: derivedWhite, blackKeys: derivedBlack } = buildKeys(startMidiValue, resolvedNoteCountClamped);
    return {
      white: derivedWhite,
      black: derivedBlack,
    };
  }, [blackKeys, resolvedNoteCountClamped, resolvedStartNote, whiteKeys]);
  const resolvedWhiteKeys = derivedKeys.white;
  const resolvedBlackKeys = derivedKeys.black;
  const panelTheme = usePanelTheme();
  const whiteKeyWidthPct = resolvedWhiteKeys.length > 0 ? 100 / resolvedWhiteKeys.length : 100;
  const blackKeyWidthPct = whiteKeyWidthPct * 0.6;
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const unitSizePx = computeSliderUnitPx(resolvedFontSize);
  const resolvedHeightUnitsClamped = Math.max(1, Math.round(resolvedHeightUnits));
  const startMidi = React.useMemo(() => resolveStartMidi(resolvedStartNote), [resolvedStartNote]);
  const rawStartIndex = WHITE_MIDI_VALUES.indexOf(startMidi);
  const maxStartIndex = Math.max(0, WHITE_MIDI_VALUES.length - 1);
  const startIndex = Math.max(
    MIN_START_INDEX,
    Math.min(maxStartIndex, rawStartIndex >= 0 ? rawStartIndex : MIN_START_INDEX),
  );
  const safeColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const safeColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedWhiteKeyColor = whiteKeyColor ?? safeColorB;
  const resolvedBlackKeyColor = blackKeyColor ?? safeColorA;
  const resolvedWhiteKeyActive = whiteKeyActiveColor ?? safeColorA;
  const resolvedBlackKeyActive = blackKeyActiveColor ?? safeColorA;
  const showInstrumentControl = showControls && resolvedInstrumentOptions.length > 0 && !soundfont && !tone;
  const effectiveInstrument = instrumentValue || resolvedInstrumentOptions[0]?.value || "";
  const selectedInstrument = React.useMemo(() => (
    resolvedInstrumentOptions.find((option) => option.value === effectiveInstrument) ?? null
  ), [effectiveInstrument, resolvedInstrumentOptions]);
  const usesTone = showInstrumentControl && (
    selectedInstrument?.source === "tone"
    || selectedInstrument?.toneConfig != null
    || effectiveInstrument === toneInstrumentValue
  );
  const resolvedSoundfontConfig = selectedInstrument?.soundfontConfig ?? soundfontConfig ?? null;
  const baseSoundfont = showInstrumentControl && !usesTone && resolvedSoundfontConfig
    ? { ...resolvedSoundfontConfig, instrument: effectiveInstrument }
    : null;
  const resolvedSoundfont = React.useMemo(() => {
    const source = soundfont ?? baseSoundfont;
    if (!source) return null;
    if (typeof source === "string") {
      return { instrument: source };
    }
    return source;
  }, [baseSoundfont, soundfont]);
  const resolvedTone = React.useMemo(() => {
    if (tone) return tone;
    if (!showInstrumentControl || !usesTone) return null;
    return selectedInstrument?.toneConfig ?? toneConfig ?? {};
  }, [selectedInstrument, showInstrumentControl, tone, toneConfig, usesTone]);
  const instrumentIconNode = instrumentIcon ?? <Piano />;
  const soundfontInstrument = resolvedSoundfont?.instrument;
  const soundfontName = resolvedSoundfont?.soundfont;
  const soundfontFormat = resolvedSoundfont?.format;
  const soundfontUrl = resolvedSoundfont?.url;
  const soundfontMonitor = resolvedSoundfont?.monitor ?? true;
  const soundfontGain = resolvedSoundfont?.gain;
  const soundfontAttack = resolvedSoundfont?.attack;
  const soundfontDecay = resolvedSoundfont?.decay;
  const soundfontSustain = resolvedSoundfont?.sustain;
  const soundfontRelease = resolvedSoundfont?.release;
  const soundfontNotes = resolvedSoundfont?.notes;
  const soundfontContext = resolvedSoundfont?.context;
  const soundfontDestination = resolvedSoundfont?.destination;
  const toneDestination = resolvedTone?.destination;
  const toneContext = resolvedTone?.context
    ?? (toneDestination?.context instanceof AudioContext ? toneDestination.context : null);
  const tonePolyphony = Math.max(1, Math.round(resolvedTone?.polyphony ?? 8));
  const toneVolume = resolvedTone?.volume;
  const toneAttack = resolvedTone?.attack;
  const toneDecay = resolvedTone?.decay;
  const toneSustain = resolvedTone?.sustain;
  const toneRelease = resolvedTone?.release;
  const setActive = React.useCallback((note: string, nextActive: boolean) => {
    if (activeNotes) return;
    setInternalActive((prev) => {
      if (nextActive) {
        if (prev[note]) return prev;
        return { ...prev, [note]: true };
      }
      if (!prev[note]) return prev;
      const next = { ...prev };
      delete next[note];
      return next;
    });
  }, [activeNotes]);

  const triggerOn = React.useCallback((note: string, frequency: number) => {
    try {
      const toneState = toneStateRef.current;
      if (toneState) {
        if (toneState.context.state === "suspended") {
          void toneState.context.resume().catch(() => {});
        }
        void toneState.toneModule.start().catch(() => {});
        toneState.synth.triggerAttack(note);
      } else {
        const soundfontState = soundfontStateRef.current;
        if (soundfontState) {
          const { instrument, context } = soundfontState;
          const existing = soundfontNotesRef.current.get(note);
          if (existing?.stop) {
            existing.stop(context.currentTime);
          }
          soundfontNotesRef.current.delete(note);
          if (context.state === "suspended") {
            void context.resume().catch(() => {});
          }
          const node = instrument.start(note, context.currentTime);
          if (node && typeof node.stop === "function") {
            soundfontNotesRef.current.set(note, node);
          }
        }
      }
    } catch {
      // ignore soundfont playback errors
    }
    activeNoteKeysRef.current.add(note);
    onNoteOn?.(note, frequency);
    setActive(note, true);
  }, [onNoteOn, setActive]);

  const triggerOff = React.useCallback((note: string) => {
    try {
      const toneState = toneStateRef.current;
      if (toneState) {
        toneState.synth.triggerRelease(note);
      } else {
        const soundfontState = soundfontStateRef.current;
        if (soundfontState) {
          const { context } = soundfontState;
          const existing = soundfontNotesRef.current.get(note);
          if (existing?.stop) {
            existing.stop(context.currentTime);
          }
          soundfontNotesRef.current.delete(note);
        }
      }
    } catch {
      // ignore soundfont playback errors
    }
    activeNoteKeysRef.current.delete(note);
    onNoteOff?.(note);
    setActive(note, false);
  }, [onNoteOff, setActive]);
  const triggerOnRef = React.useRef(triggerOn);
  const triggerOffRef = React.useRef(triggerOff);
  const releasePointerNoteRef = React.useRef(() => {});
  const clearAllNotesRef = React.useRef(() => {});
  const startMidiRef = React.useRef(startMidi);
  const noteCountRef = React.useRef(resolvedNoteCountClamped);
  React.useEffect(() => {
    triggerOnRef.current = triggerOn;
  }, [triggerOn]);
  React.useEffect(() => {
    triggerOffRef.current = triggerOff;
  }, [triggerOff]);
  React.useEffect(() => {
    releasePointerNoteRef.current = () => {
      const state = pointerStateRef.current;
      if (state.note) {
        triggerOffRef.current(state.note);
      }
      pointerStateRef.current = { pointerId: null, note: null };
    };
  }, []);
  React.useEffect(() => {
    clearAllNotesRef.current = () => {
      const notes = Array.from(activeNoteKeysRef.current);
      notes.forEach((note) => triggerOffRef.current(note));
      activeNoteKeysRef.current.clear();
    };
  }, []);
  React.useEffect(() => {
    startMidiRef.current = startMidi;
  }, [startMidi]);
  React.useEffect(() => {
    noteCountRef.current = resolvedNoteCountClamped;
  }, [resolvedNoteCountClamped]);

  React.useEffect(() => {
    if (!resolvedTone) {
      toneStateRef.current = null;
      return undefined;
    }
    if (typeof AudioContext === "undefined" && !toneContext && !toneDestination) {
      toneStateRef.current = null;
      return undefined;
    }
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      let toneModule: ToneModuleLike;
      try {
        toneModule = await loadToneModule();
      } catch (error) {
        if (!cancelled) {
          setAudioDependencyError(createMissingAudioDependencyError("tone", error));
        }
        return;
      }
      if (cancelled) {
        toneStateRef.current = null;
        return;
      }
      const destination = toneDestination;
      const destinationContext = destination?.context;
      const resolvedContext = toneContext
        ?? (destinationContext instanceof AudioContext ? destinationContext : null)
        ?? new AudioContext();
      const context = resolvedContext;
      const ownsContext = !toneContext && !destination;
      const toneContextInstance = new toneModule.Context({ context }) as ToneContextLike;
      const previousContext = toneModule.getContext();
      toneModule.setContext(toneContextInstance);
      const envelope = {
        attack: toneAttack ?? 0.01,
        decay: toneDecay ?? 0.1,
        sustain: toneSustain ?? 0.3,
        release: toneRelease ?? 0.8,
      };
      const synth = new toneModule.PolySynth(toneModule.Synth, { envelope }) as ToneSynthLike;
      synth.maxPolyphony = tonePolyphony;
      if (toneVolume !== undefined) {
        synth.volume.value = toneVolume;
      }
      if (destination && destination !== context.destination) {
        synth.connect(destination);
      } else {
        synth.toDestination();
      }
      clearAllNotesRef.current();
      toneStateRef.current = {
        toneModule,
        synth,
        context,
        destination: destination ?? context.destination,
        ownsContext,
        toneContext: toneContextInstance,
      };
      cleanup = () => {
        clearAllNotesRef.current();
        synth.releaseAll();
        synth.disconnect();
        synth.dispose();
        toneStateRef.current = null;
        if (toneModule.getContext() === toneContextInstance) {
          toneModule.setContext(previousContext);
        }
        if (ownsContext) {
          toneContextInstance.dispose();
          void context.close().catch(() => {});
        }
      };
      if (cancelled) {
        cleanup();
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [
    resolvedTone,
    toneContext,
    toneDestination,
    tonePolyphony,
    toneVolume,
    toneAttack,
    toneDecay,
    toneSustain,
    toneRelease,
  ]);

  React.useEffect(() => {
    if (!soundfontInstrument || resolvedTone) {
      soundfontStateRef.current = null;
      return undefined;
    }
    if (typeof AudioContext === "undefined" && !soundfontContext && !soundfontDestination) {
      soundfontStateRef.current = null;
      return undefined;
    }
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      let soundfontModule: SoundfontModuleLike;
      try {
        soundfontModule = await loadSoundfontModule();
      } catch (error) {
        if (!cancelled) {
          setAudioDependencyError(createMissingAudioDependencyError("soundfont-player", error));
        }
        return;
      }
      if (cancelled) {
        soundfontStateRef.current = null;
        return;
      }
      const destination = soundfontDestination;
      const destinationContext = destination?.context;
      const resolvedContext = soundfontContext
        ?? (destinationContext instanceof AudioContext ? destinationContext : null)
        ?? new AudioContext();
      const context = resolvedContext;
      const ownsContext = !soundfontContext && !destination;
      const baseUrl = soundfontUrl ? soundfontUrl.replace(/\/$/, "") : null;
      const options: Record<string, unknown> = {};
      if (soundfontName) {
        options.soundfont = soundfontName;
      }
      if (soundfontFormat) {
        options.format = soundfontFormat;
      }
      if (soundfontGain !== undefined) {
        options.gain = soundfontGain;
      }
      if (soundfontAttack !== undefined) {
        options.attack = soundfontAttack;
      }
      if (soundfontDecay !== undefined) {
        options.decay = soundfontDecay;
      }
      if (soundfontSustain !== undefined) {
        options.sustain = soundfontSustain;
      }
      if (soundfontRelease !== undefined) {
        options.release = soundfontRelease;
      }
      if (soundfontNotes !== undefined) {
        options.notes = soundfontNotes;
      }
      if (!soundfontMonitor && destination) {
        options.destination = destination;
      }
      if (baseUrl) {
        options.nameToUrl = (name: string, sf?: string, format?: string) => {
          const resolvedSoundfont = sf ?? soundfontName ?? "MusyngKite";
          const resolvedFormat = format === "ogg" ? "ogg" : (soundfontFormat ?? "mp3");
          return `${baseUrl}/${resolvedSoundfont}/${name}-${resolvedFormat}.js`;
        };
      }
      clearAllNotesRef.current();
      soundfontNotesRef.current.forEach((entry) => {
        if (entry?.stop) {
          entry.stop(context.currentTime);
        }
      });
      soundfontNotesRef.current.clear();
      soundfontStateRef.current = null;
      const instrumentName = soundfontInstrument;
      soundfontModule.instrument(context, instrumentName, options)
        .then((instrument) => {
          if (cancelled) return;
          if (destination && (soundfontMonitor || options.destination !== destination)) {
            if (destination !== context.destination && typeof instrument.connect === "function") {
              instrument.connect(destination);
            }
          }
          soundfontStateRef.current = {
            instrument,
            context,
            destination: destination ?? context.destination,
            ownsContext,
          };
        })
        .catch(() => {
          if (cancelled) return;
          soundfontStateRef.current = null;
        });
      cleanup = () => {
        clearAllNotesRef.current();
        soundfontNotesRef.current.forEach((entry) => {
          if (entry?.stop) {
            entry.stop();
          }
        });
        soundfontNotesRef.current.clear();
        soundfontStateRef.current = null;
        if (ownsContext) {
          void context.close().catch(() => {});
        }
      };
      if (cancelled) {
        cleanup();
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [
    soundfontInstrument,
    resolvedTone,
    soundfontName,
    soundfontFormat,
    soundfontUrl,
    soundfontGain,
    soundfontAttack,
    soundfontDecay,
    soundfontSustain,
    soundfontRelease,
    soundfontMonitor,
    soundfontNotes,
    soundfontContext,
    soundfontDestination,
  ]);

  React.useEffect(() => {
    if (!soundfontInstrument || resolvedTone) return;
    clearAllNotesRef.current();
    soundfontNotesRef.current.forEach((entry) => {
      if (entry?.stop) {
        entry.stop();
      }
    });
    soundfontNotesRef.current.clear();
    if (!activeNotes) {
      setInternalActive({});
    }
  }, [activeNotes, resolvedNoteCountClamped, soundfontInstrument, startMidi, resolvedTone]);

  const handleKeyPointerDown = React.useCallback((
    event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKeyboardKey,
  ) => {
    pointerStateRef.current = { pointerId: event.pointerId, note: key.note };
    event.preventDefault();
    triggerOn(key.note, key.frequency);
  }, [triggerOn]);

  const handleKeyPointerEnter = React.useCallback((
    event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKeyboardKey,
  ) => {
    const state = pointerStateRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (state.note === key.note) return;
    if (state.note) triggerOff(state.note);
    pointerStateRef.current.note = key.note;
    triggerOn(key.note, key.frequency);
  }, [triggerOff, triggerOn]);

  const handleKeyPointerLeave = React.useCallback((
    event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKeyboardKey,
  ) => {
    const state = pointerStateRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (state.note !== key.note) return;
    triggerOff(key.note);
    pointerStateRef.current.note = null;
  }, [triggerOff]);

  const handleKeyPointerUp = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (state.note) triggerOff(state.note);
    pointerStateRef.current = { pointerId: null, note: null };
  }, [triggerOff]);

  const combinedStyle: React.CSSProperties = { ...style };
  (combinedStyle as Record<string, string>)["--ui-bits-color-a"] = safeColorA;
  (combinedStyle as Record<string, string>)["--ui-bits-color-b"] = safeColorB;
  (combinedStyle as Record<string, string>)["--vk-font-size"] = `${resolvedFontSize}px`;
  (combinedStyle as Record<string, string>)["--vk-header-height"] = `${unitSizePx}px`;
  (combinedStyle as Record<string, string>)["--vk-body-height"] = `${unitSizePx * resolvedHeightUnitsClamped}px`;
  (combinedStyle as Record<string, string>)["--vk-header-bg"] = safeColorB;
  (combinedStyle as Record<string, string>)["--vk-header-text"] = safeColorA;
  (combinedStyle as Record<string, string>)["--vk-border"] = safeColorA;
  (combinedStyle as Record<string, string>)["--vk-bg"] = resolvedBlackKeyColor;
  (combinedStyle as Record<string, string>)["--vk-white"] = resolvedWhiteKeyColor;
  (combinedStyle as Record<string, string>)["--vk-white-text"] = resolvedBlackKeyColor;
  (combinedStyle as Record<string, string>)["--vk-black"] = resolvedBlackKeyColor;
  (combinedStyle as Record<string, string>)["--vk-black-text"] = resolvedWhiteKeyColor;
  (combinedStyle as Record<string, string>)["--vk-white-active"] = resolvedWhiteKeyActive;
  (combinedStyle as Record<string, string>)["--vk-black-active"] = resolvedBlackKeyActive;

  const handleStartIndexChange = React.useCallback((value: number) => {
    const index = Math.max(MIN_START_INDEX, Math.min(maxStartIndex, Math.round(value)));
    const nextMidi = WHITE_MIDI_VALUES[index] ?? WHITE_MIDI_VALUES[MIN_START_INDEX] ?? 60;
    setResolvedStartNote(nextMidi);
  }, [maxStartIndex, setResolvedStartNote]);
  const handleNoteCountChange = React.useCallback((value: number) => {
    const next = Math.max(4, Math.min(88, Math.round(value)));
    setResolvedNoteCount(next);
  }, [setResolvedNoteCount]);
  const handleHeightChange = React.useCallback((value: number) => {
    const next = Math.max(3, Math.min(12, Math.round(value)));
    setResolvedHeightUnits(next);
  }, [setResolvedHeightUnits]);

  const headerControls = showControls ? (
    <div className="ui-bits-virtual-keyboard__controls">
      {showInstrumentControl ? (
        <IconDropdown
          label="Soundfont"
          options={resolvedInstrumentOptions}
          value={effectiveInstrument}
          onChange={(value) => setInstrumentValue(value)}
          borderStyle="b"
          fontSize={resolvedFontSize}
          className="ui-bits-virtual-keyboard__dropdown"
          icon={instrumentIconNode}
          preventFocusOnPointerDown
        />
      ) : null}
      <div className="ui-bits-virtual-keyboard__control-group">
        <span className="ui-bits-virtual-keyboard__control-label">Start:</span>
        <Dial
          min={MIN_START_INDEX}
          max={maxStartIndex}
          step={1}
          value={startIndex}
          onChange={handleStartIndexChange}
          fontSize={resolvedFontSize}
          indicatorStyle="arc"
          indicatorColor={dialIndicatorColor}
          ariaLabel="Keyboard start note"
          formatDisplayValue={(value) => {
            const index = Math.max(MIN_START_INDEX, Math.min(maxStartIndex, Math.round(value)));
            const midi = WHITE_MIDI_VALUES[index] ?? WHITE_MIDI_VALUES[MIN_START_INDEX] ?? 60;
            return midiToNoteName(midi);
          }}
        />
      </div>
      <div className="ui-bits-virtual-keyboard__control-group">
        <span className="ui-bits-virtual-keyboard__control-label">Notes:</span>
        <Dial
          min={4}
          max={88}
          step={1}
          value={resolvedNoteCountClamped}
          onChange={handleNoteCountChange}
          fontSize={resolvedFontSize}
          indicatorStyle="arc"
          indicatorColor={dialIndicatorColor}
          ariaLabel="Keyboard note count"
          formatDisplayValue={(value) => `${Math.round(value)}`}
        />
      </div>
      {showHeightControl ? (
        <div className="ui-bits-virtual-keyboard__control-group">
          <span className="ui-bits-virtual-keyboard__control-label">Height:</span>
          <Dial
            min={3}
            max={12}
            step={1}
            value={resolvedHeightUnitsClamped}
            onChange={handleHeightChange}
            fontSize={resolvedFontSize}
            indicatorStyle="arc"
            indicatorColor={dialIndicatorColor}
            ariaLabel="Keyboard height"
          />
        </div>
      ) : null}
    </div>
  ) : null;
  const headerContent = showControls
    ? (
      <>
        {headerControls}
        {header ? <div className="ui-bits-virtual-keyboard__header-extra">{header}</div> : null}
      </>
    )
    : header;

  const keyboardModeOptions = React.useMemo(() => ([
    {
      value: "pointer",
      icon: <MousePointer2 />,
      ariaLabel: "Pointer mode",
      title: "Pointer mode",
    },
    {
      value: "keyboard",
      icon: <CaseUpper />,
      ariaLabel: "Keyboard mode",
      title: "Keyboard mode",
    },
  ]), []);
  const getShortcutLabel = React.useCallback((note: string) => {
    if (!shortcutsEnabled) return null;
    const midi = parseNoteName(note);
    if (midi == null) return null;
    const index = midi - startMidi;
    if (index < 0 || index >= resolvedNoteCountClamped || index >= KEYBOARD_SHORTCUTS.length) return null;
    return KEYBOARD_SHORTCUTS[index];
  }, [resolvedNoteCountClamped, shortcutsEnabled, startMidi]);

  React.useEffect(() => {
    if (!shortcutsEnabled) {
      pressedKeysRef.current.forEach((note) => triggerOffRef.current(note));
      pressedKeysRef.current.clear();
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (shouldIgnoreKeyboardEvent(event.target)) return;
      const key = event.key.toLowerCase();
      const index = KEYBOARD_SHORTCUTS.indexOf(key);
      const count = noteCountRef.current;
      if (index < 0 || index >= count) return;
      if (pressedKeysRef.current.has(key)) return;
      const midi = startMidiRef.current + index;
      const note = midiToNoteName(midi);
      const frequency = midiToFrequency(midi);
      pressedKeysRef.current.set(key, note);
      event.preventDefault();
      triggerOnRef.current(note, frequency);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const note = pressedKeysRef.current.get(key);
      if (!note) return;
      pressedKeysRef.current.delete(key);
      event.preventDefault();
      triggerOffRef.current(note);
      if (pressedKeysRef.current.size === 0) {
        clearAllNotesRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      pressedKeysRef.current.forEach((note) => triggerOffRef.current(note));
      pressedKeysRef.current.clear();
    };
  }, [shortcutsEnabled]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleWindowPointerUp = () => {
      releasePointerNoteRef.current();
      clearAllNotesRef.current();
    };
    window.addEventListener("pointerup", handleWindowPointerUp, true);
    window.addEventListener("pointercancel", handleWindowPointerUp, true);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp, true);
      window.removeEventListener("pointercancel", handleWindowPointerUp, true);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleWindowBlur = () => {
      releasePointerNoteRef.current();
      pressedKeysRef.current.forEach((note) => triggerOffRef.current(note));
      pressedKeysRef.current.clear();
      clearAllNotesRef.current();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleWindowBlur();
      }
    };
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className={["ui-bits-virtual-keyboard", className].filter(Boolean).join(" ")}
      style={combinedStyle}
      aria-label={ariaLabel}
    >
      <div className="ui-bits-virtual-keyboard__header">
        <div className="ui-bits-virtual-keyboard__header-inner">
          <div className="ui-bits-virtual-keyboard__header-controls">
            <IconButton
              behavior="cycle"
              value={shortcutsEnabled ? "keyboard" : "pointer"}
              options={keyboardModeOptions}
              onChange={(nextValue) => setShortcutsEnabled(nextValue === "keyboard")}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              borderStyle="none"
              fontSize={resolvedFontSize}
              colorA={safeColorA}
              colorB={safeColorB}
            />
          </div>
          <div className="ui-bits-virtual-keyboard__header-content">
            {headerContent ?? null}
          </div>
        </div>
      </div>
      <div className="ui-bits-virtual-keyboard__body">
        <div className="ui-bits-virtual-keyboard__white">
          {resolvedWhiteKeys.map((key) => (
            <button
              key={key.note}
              type="button"
              className={`ui-bits-virtual-keyboard__key ui-bits-virtual-keyboard__key--white${resolvedActive[key.note] ? " is-active" : ""}`}
              data-note={key.note}
              data-frequency={key.frequency}
              aria-label={`Play ${key.note}`}
              aria-pressed={Boolean(resolvedActive[key.note])}
              onPointerDown={(event) => handleKeyPointerDown(event, key)}
              onPointerEnter={(event) => handleKeyPointerEnter(event, key)}
              onPointerLeave={(event) => handleKeyPointerLeave(event, key)}
              onPointerUp={(event) => {
                handleKeyPointerUp(event);
              }}
              onPointerCancel={(event) => {
                handleKeyPointerUp(event);
              }}
            >
              {(() => {
                const shortcutLabel = getShortcutLabel(key.note);
                if (shortcutLabel) {
                  return <span className="ui-bits-virtual-keyboard__label">{shortcutLabel}</span>;
                }
                if (!resolvedShowLabels) return null;
                return <span className="ui-bits-virtual-keyboard__label">{key.note}</span>;
              })()}
            </button>
          ))}
        </div>
        <div className="ui-bits-virtual-keyboard__black">
          {resolvedBlackKeys.map((key, index) => {
            const position = key.position ?? index + 0.5;
            return (
              <button
                key={key.note}
                type="button"
                className={`ui-bits-virtual-keyboard__key ui-bits-virtual-keyboard__key--black${resolvedActive[key.note] ? " is-active" : ""}`}
                style={{
                  left: `${position * whiteKeyWidthPct}%`,
                  width: `${blackKeyWidthPct}%`,
                }}
                data-note={key.note}
                data-frequency={key.frequency}
                aria-label={`Play ${key.note}`}
                aria-pressed={Boolean(resolvedActive[key.note])}
                onPointerDown={(event) => handleKeyPointerDown(event, key)}
                onPointerEnter={(event) => handleKeyPointerEnter(event, key)}
                onPointerLeave={(event) => handleKeyPointerLeave(event, key)}
                onPointerUp={(event) => {
                  handleKeyPointerUp(event);
                }}
                onPointerCancel={(event) => {
                  handleKeyPointerUp(event);
                }}
              >
                {(() => {
                  const shortcutLabel = getShortcutLabel(key.note);
                  if (shortcutLabel) {
                    return <span className="ui-bits-virtual-keyboard__label">{shortcutLabel}</span>;
                  }
                  if (!resolvedShowLabels) return null;
                  return <span className="ui-bits-virtual-keyboard__label">{key.note}</span>;
                })()}
              </button>
            );
          })}
        </div>
      </div>
      <div className="ui-bits-virtual-keyboard__footer">
        <div className="ui-bits-virtual-keyboard__footer-inner">
          <div className="ui-bits-virtual-keyboard__footer-controls" />
          <div className="ui-bits-virtual-keyboard__footer-content">
            {footer ?? null}
          </div>
        </div>
      </div>
    </div>
  );
}
