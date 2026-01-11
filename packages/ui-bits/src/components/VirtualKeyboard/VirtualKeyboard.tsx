import React from "react";
import { Keyboard } from "lucide-react";
import IconButton from "../IconButton";
import "./virtual-keyboard.css";

export interface VirtualKeyboardKey {
  note: string;
  frequency: number;
  position?: number;
}

export interface VirtualKeyboardProps {
  whiteKeys?: VirtualKeyboardKey[];
  blackKeys?: VirtualKeyboardKey[];
  startNote?: number | string;
  noteCount?: number;
  showLabels?: boolean;
  heightUnits?: number;
  header?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  whiteKeyColor?: string;
  blackKeyColor?: string;
  whiteKeyActiveColor?: string;
  blackKeyActiveColor?: string;
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

function readKey(target: HTMLElement | null) {
  const element = target?.closest("[data-note]") as HTMLElement | null;
  if (!element) return null;
  const note = element.getAttribute("data-note");
  const frequency = Number(element.getAttribute("data-frequency"));
  if (!note || !Number.isFinite(frequency)) return null;
  return { note, frequency };
}

const KEYBOARD_SHORTCUTS = [
  "a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j",
  "k", "o", "l", "p", ";", "'", "z", "x", "c", "v", "b", "n",
];

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
  colorA,
  colorB,
  whiteKeyColor,
  blackKeyColor,
  whiteKeyActiveColor,
  blackKeyActiveColor,
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
    onNoteOn?.(note, frequency);
    setActive(note, true);
  }, [onNoteOn, setActive]);

  const triggerOff = React.useCallback((note: string) => {
    onNoteOff?.(note);
    setActive(note, false);
  }, [onNoteOff, setActive]);
  const triggerOnRef = React.useRef(triggerOn);
  const triggerOffRef = React.useRef(triggerOff);
  const startMidiRef = React.useRef(startMidi);
  const noteCountRef = React.useRef(noteCount);
  React.useEffect(() => {
    triggerOnRef.current = triggerOn;
  }, [triggerOn]);
  React.useEffect(() => {
    triggerOffRef.current = triggerOff;
  }, [triggerOff]);
  React.useEffect(() => {
    startMidiRef.current = startMidi;
  }, [startMidi]);
  React.useEffect(() => {
    noteCountRef.current = noteCount;
  }, [noteCount]);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.pointerId !== null) return;
    const key = readKey(event.target as HTMLElement | null);
    if (!key) return;
    pointerStateRef.current = { pointerId: event.pointerId, note: key.note };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    triggerOn(key.note, key.frequency);
  }, [triggerOn]);

  const handlePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (state.pointerId !== event.pointerId) return;
    const doc = event.currentTarget.ownerDocument ?? document;
    const element = doc.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const key = readKey(element);
    if (!key) {
      if (state.note) {
        triggerOff(state.note);
        pointerStateRef.current.note = null;
      }
      return;
    }
    if (key.note === state.note) return;
    if (state.note) triggerOff(state.note);
    pointerStateRef.current.note = key.note;
    triggerOn(key.note, key.frequency);
  }, [triggerOff, triggerOn]);

  const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (state.note) triggerOff(state.note);
    pointerStateRef.current = { pointerId: null, note: null };
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }, [triggerOff]);

  const combinedStyle: React.CSSProperties = { ...style };
  (combinedStyle as Record<string, string>)["--vk-font-size"] = `${resolvedFontSize}px`;
  (combinedStyle as Record<string, string>)["--vk-header-height"] = `${unitSizePx}px`;
  (combinedStyle as Record<string, string>)["--vk-body-height"] = `${unitSizePx * resolvedHeightUnits}px`;
  (combinedStyle as Record<string, string>)["--vk-header-bg"] = safeColorA;
  (combinedStyle as Record<string, string>)["--vk-header-text"] = safeColorB;
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
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeysRef.current.forEach((note) => triggerOffRef.current(note));
      pressedKeysRef.current.clear();
    };
  }, [shortcutsEnabled]);

  return (
    <div
      className={["ui-bits-virtual-keyboard", className].filter(Boolean).join(" ")}
      style={combinedStyle}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="ui-bits-virtual-keyboard__header">
        <div className="ui-bits-virtual-keyboard__header-inner">
          <IconButton
            behavior="toggle"
            toggled={shortcutsEnabled}
            onToggle={setShortcutsEnabled}
            borderStyle="none"
            fontSize={resolvedFontSize}
            colorA={safeColorB}
            colorB={safeColorA}
            aria-label={shortcutsEnabled ? "Disable keyboard shortcuts" : "Enable keyboard shortcuts"}
            title={shortcutsEnabled ? "Disable keyboard shortcuts" : "Enable keyboard shortcuts"}
          >
            <Keyboard />
          </IconButton>
          <div className="ui-bits-virtual-keyboard__header-label">
            {header ?? null}
          </div>
          <div />
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
            >
              {showLabels ? <span className="ui-bits-virtual-keyboard__label">{key.note}</span> : null}
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
              >
                {showLabels ? <span className="ui-bits-virtual-keyboard__label">{key.note}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
