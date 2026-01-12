import React from "react";
import { MousePointer2, CaseUpper } from "lucide-react";
import * as Soundfont from "soundfont-player";
import type { Player as SoundfontPlayer } from "soundfont-player";
import IconButton from "../IconButton";
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

export interface VirtualKeyboardProps {
  whiteKeys?: VirtualKeyboardKey[];
  blackKeys?: VirtualKeyboardKey[];
  startNote?: number | string;
  noteCount?: number;
  showLabels?: boolean;
  heightUnits?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  whiteKeyColor?: string;
  blackKeyColor?: string;
  whiteKeyActiveColor?: string;
  blackKeyActiveColor?: string;
  soundfont?: VirtualKeyboardSoundfont | string;
  keyboardShortcutsEnabled?: boolean;
  defaultKeyboardShortcutsEnabled?: boolean;
  onKeyboardShortcutsChange?: (enabled: boolean) => void;
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
const MIN_SLIDER_UNIT_PX = 18;
const FALLBACK_COLOR_A = "#f2f0e5";
const FALLBACK_COLOR_B = "#1c1b1a";
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK_OFFSETS = new Set([1, 3, 6, 8, 10]);
const WHITE_OFFSETS = new Set([0, 2, 4, 5, 7, 9, 11]);

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

function shouldIgnoreKeyboardEvent(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
}

export default function VirtualKeyboard({
  whiteKeys,
  blackKeys,
  startNote = DEFAULT_START_NOTE,
  noteCount = DEFAULT_NOTE_COUNT,
  showLabels = false,
  heightUnits = DEFAULT_HEIGHT_UNITS,
  header,
  footer,
  colorA,
  colorB,
  whiteKeyColor,
  blackKeyColor,
  whiteKeyActiveColor,
  blackKeyActiveColor,
  soundfont,
  keyboardShortcutsEnabled,
  defaultKeyboardShortcutsEnabled = DEFAULT_KEYBOARD_SHORTCUTS_ENABLED,
  onKeyboardShortcutsChange,
  activeNotes,
  onNoteOn,
  onNoteOff,
  className,
  style,
  fontSize,
  ariaLabel = "Virtual keyboard",
}: VirtualKeyboardProps) {
  const [internalShortcuts, setInternalShortcuts] = React.useState(defaultKeyboardShortcutsEnabled);
  const isShortcutsControlled = keyboardShortcutsEnabled !== undefined;
  const shortcutsEnabled = isShortcutsControlled ? keyboardShortcutsEnabled : internalShortcuts;
  const pointerStateRef = React.useRef<{ pointerId: number | null; note: string | null }>({
    pointerId: null,
    note: null,
  });
  const pressedKeysRef = React.useRef<Map<string, string>>(new Map());
  const activeNoteKeysRef = React.useRef<Set<string>>(new Set());
  const soundfontStateRef = React.useRef<{
    instrument: SoundfontPlayer;
    context: AudioContext;
    destination: AudioNode;
    ownsContext: boolean;
  } | null>(null);
  const soundfontNotesRef = React.useRef<Map<string, SoundfontNote>>(new Map());
  const [internalActive, setInternalActive] = React.useState<Record<string, boolean>>({});
  const resolvedActive = activeNotes ?? internalActive;
  const derivedKeys = React.useMemo<{
    white: VirtualKeyboardKey[];
    black: VirtualKeyboardKey[];
  }>(() => {
    if (whiteKeys && blackKeys) {
      return { white: whiteKeys, black: blackKeys };
    }
    const startMidi = resolveStartMidi(startNote);
    const { whiteKeys: derivedWhite, blackKeys: derivedBlack } = buildKeys(startMidi, noteCount);
    return {
      white: derivedWhite,
      black: derivedBlack,
    };
  }, [blackKeys, noteCount, startNote, whiteKeys]);
  const resolvedWhiteKeys = derivedKeys.white;
  const resolvedBlackKeys = derivedKeys.black;
  const whiteKeyWidthPct = resolvedWhiteKeys.length > 0 ? 100 / resolvedWhiteKeys.length : 100;
  const blackKeyWidthPct = whiteKeyWidthPct * 0.6;
  const resolvedFontSize = fontSize ?? 12;
  const unitSizePx = computeSliderUnitPx(resolvedFontSize);
  const resolvedHeightUnits = Math.max(1, Math.round(heightUnits));
  const startMidi = React.useMemo(() => resolveStartMidi(startNote), [startNote]);
  const safeColorA = colorA ?? FALLBACK_COLOR_A;
  const safeColorB = colorB ?? FALLBACK_COLOR_B;
  const resolvedWhiteKeyColor = whiteKeyColor ?? safeColorB;
  const resolvedBlackKeyColor = blackKeyColor ?? safeColorA;
  const resolvedWhiteKeyActive = whiteKeyActiveColor ?? safeColorA;
  const resolvedBlackKeyActive = blackKeyActiveColor ?? safeColorA;
  const resolvedSoundfont = React.useMemo(() => {
    if (!soundfont) return null;
    if (typeof soundfont === "string") {
      return { instrument: soundfont };
    }
    return soundfont;
  }, [soundfont]);
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
    } catch {
      // ignore soundfont playback errors
    }
    activeNoteKeysRef.current.add(note);
    onNoteOn?.(note, frequency);
    setActive(note, true);
  }, [onNoteOn, setActive]);

  const triggerOff = React.useCallback((note: string) => {
    try {
      const soundfontState = soundfontStateRef.current;
      if (soundfontState) {
        const { context } = soundfontState;
        const existing = soundfontNotesRef.current.get(note);
        if (existing?.stop) {
          existing.stop(context.currentTime);
        }
        soundfontNotesRef.current.delete(note);
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
  const noteCountRef = React.useRef(noteCount);
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
    noteCountRef.current = noteCount;
  }, [noteCount]);

  React.useEffect(() => {
    if (!soundfontInstrument) {
      soundfontStateRef.current = null;
      return undefined;
    }
    if (typeof AudioContext === "undefined" && !soundfontContext && !soundfontDestination) {
      soundfontStateRef.current = null;
      return undefined;
    }
    let cancelled = false;
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
    const instrumentName = soundfontInstrument as Parameters<typeof Soundfont.instrument>[1];
    Soundfont.instrument(context, instrumentName, options)
      .then((instrument) => {
        if (cancelled) return;
        if (destination && (soundfontMonitor || options.destination !== destination)) {
          if (destination !== context.destination) {
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
    return () => {
      cancelled = true;
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
  }, [
    soundfontInstrument,
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
    if (!soundfontInstrument) return;
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
  }, [activeNotes, noteCount, soundfontInstrument, startMidi]);

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
  (combinedStyle as Record<string, string>)["--vk-body-height"] = `${unitSizePx * resolvedHeightUnits}px`;
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

  const setShortcutsEnabled = React.useCallback((next: boolean) => {
    if (!isShortcutsControlled) {
      setInternalShortcuts(next);
    }
    onKeyboardShortcutsChange?.(next);
  }, [isShortcutsControlled, onKeyboardShortcutsChange]);
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
    if (index < 0 || index >= noteCount || index >= KEYBOARD_SHORTCUTS.length) return null;
    return KEYBOARD_SHORTCUTS[index];
  }, [noteCount, shortcutsEnabled, startMidi]);

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
            {header ?? null}
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
                if (!showLabels) return null;
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
                  if (!showLabels) return null;
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
