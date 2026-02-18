import React from "react";
import { useControlStoreState } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
import { createPresetSnapshot, usePresetStore, type PresetSnapshot } from "../../presetStore";
import IconButton from "../IconButton";
import ListRow from "../ListRow";
import ListSurface from "../ListSurface";
import { ClipboardCopy, Save } from "lucide-react";
import TextInput from "../TextInput";
import "./preset-manager.css";

export interface PresetManagerPreset {
  id?: string;
  name: string;
  readonly?: boolean;
  snapshot?: PresetSnapshot;
}

export interface PresetManagerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect"> {
  presets?: PresetManagerPreset[];
  onSave?: (name: string) => void;
  onSelect?: (preset: PresetManagerPreset) => void;
  onDelete?: (preset: PresetManagerPreset) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  saveLabel?: string;
  maxListHeight?: number | string;
  colorA?: string;
  colorB?: string;
  fontSize?: number;
  disabled?: boolean;
}

const FALLBACK_COLOR_A = "#f0f0f0";
const FALLBACK_COLOR_B = "#2f2f2f";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function computeRowHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isPresetValueEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isPresetValueEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isPresetValueEqual(a[key], b[key]));
  }
  return false;
}

function isPresetMatch(current: PresetSnapshot, preset: PresetSnapshot): boolean {
  const currentKeys = Object.keys(current);
  const presetKeys = Object.keys(preset);
  if (currentKeys.length !== presetKeys.length) return false;
  return presetKeys.every((key) => isPresetValueEqual(current[key], preset[key]));
}

const PresetManager = React.forwardRef<HTMLDivElement, PresetManagerProps>((props, ref) => {
  const {
    presets,
    onSave,
    onSelect,
    onDelete,
    value,
    defaultValue = "",
    onValueChange,
    placeholder = "Preset name...",
    emptyLabel = "No presets saved",
    saveLabel = "Save",
    maxListHeight,
    colorA,
    colorB,
    fontSize,
    disabled = false,
    className,
    style,
    ...rest
  } = props;
  const presetStore = usePresetStore();
  const resolvedPresets = presets ?? presetStore?.presets ?? [];
  const resolvedOnSave = onSave ?? presetStore?.savePreset;
  const resolvedOnSelect = onSelect ?? presetStore?.selectPreset;
  const resolvedOnDelete = onDelete ?? presetStore?.deletePreset;
  const storeState = useControlStoreState();
  const currentSnapshot = React.useMemo(() => {
    if (presetStore?.getSnapshot) {
      return presetStore.getSnapshot();
    }
    if (!storeState) return null;
    return createPresetSnapshot(storeState);
  }, [presetStore, storeState]);
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;
  const rowHeight = computeRowHeight(resolvedFontSize);
  const paddingY = Math.round(resolvedFontSize * SLIDER_PAD_Y_EM);
  const paddingX = Math.round(resolvedFontSize * 0.7);
  const resolvedMaxListHeight = resolveSize(maxListHeight) ?? `${rowHeight * 6}px`;

  const handleValueChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextValue = event.target.value;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const handleSave = () => {
    const name = resolvedValue.trim();
    if (!name || disabled) return;
    resolvedOnSave?.(name);
    if (!isControlled) {
      setInternalValue("");
    }
    onValueChange?.("");
  };

  const handleCopy = async () => {
    if (disabled || !currentSnapshot) return;
    const payload = JSON.stringify(currentSnapshot, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        return;
      }
    } catch {
      // Fall back to legacy copy path.
    }
    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSave();
  };

  const handleSelect = (preset: PresetManagerPreset) => {
    if (disabled) return;
    resolvedOnSelect?.(preset);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, preset: PresetManagerPreset) => {
    event.stopPropagation();
    if (disabled || preset.readonly) return;
    resolvedOnDelete?.(preset);
  };

  return (
    <div
      ref={ref}
      className={["ui-bits-preset-manager", className].filter(Boolean).join(" ")}
      style={{
        ...(style ?? {}),
        "--pm-color-a": resolvedColorA,
        "--pm-color-b": resolvedColorB,
        "--pm-row-height": `${rowHeight}px`,
        "--pm-padding-y": `${paddingY}px`,
        "--pm-padding-x": `${paddingX}px`,
        "--pm-max-height": resolvedMaxListHeight,
        "--ui-bits-list-max-height": resolvedMaxListHeight,
        "--ui-bits-list-row-min-height": `${rowHeight}px`,
        "--ui-bits-list-gap": "2px",
        "--ui-bits-list-scrollbar-color": resolvedColorA,
        "--ui-bits-list-row-height": `${rowHeight}px`,
        "--ui-bits-list-row-padding-x": `${paddingX}px`,
        "--ui-bits-list-row-color-a": resolvedColorA,
        "--ui-bits-list-row-color-b": resolvedColorB,
        "--ui-bits-list-row-active-border": resolvedColorB,
        fontSize: resolvedFontSize,
      } as React.CSSProperties}
      {...rest}
    >
      <div className="ui-bits-preset-manager__input-row">
        <TextInput
          value={resolvedValue}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="ui-bits-preset-manager__input"
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle="a"
          fontSize={resolvedFontSize}
          padding={`${paddingY}px ${paddingX}px`}
          style={{ height: rowHeight, flex: 1, minWidth: 0 }}
          disabled={disabled}
          aria-label="Preset name"
        />
        <IconButton
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle="a"
          fontSize={resolvedFontSize}
          behavior="momentary"
          disabled={disabled}
          onClick={handleSave}
          aria-label={saveLabel}
          title={saveLabel}
        >
          <Save />
        </IconButton>
        <IconButton
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle="a"
          fontSize={resolvedFontSize}
          behavior="momentary"
          disabled={disabled || !currentSnapshot}
          onClick={handleCopy}
          aria-label="Copy preset"
          title="Copy preset"
        >
          <ClipboardCopy />
        </IconButton>
      </div>
      <ListSurface
        className="ui-bits-preset-manager__surface"
        listClassName="ui-bits-preset-manager__list"
        columns={2}
        isEmpty={resolvedPresets.length === 0}
        emptyState={emptyLabel}
      >
        {resolvedPresets.map((preset) => {
          const isDisabled = disabled;
          const isActivePreset = Boolean(
            currentSnapshot
            && preset.snapshot
            && isPresetMatch(currentSnapshot, preset.snapshot),
          );
          return (
            <ListRow
              key={preset.id ?? preset.name}
              className="ui-bits-preset-manager__item"
              active={isActivePreset}
              disabled={isDisabled}
              onSelect={() => handleSelect(preset)}
            >
              <span className="ui-bits-preset-manager__name">{preset.name}</span>
              {resolvedOnDelete ? (
                <button
                  type="button"
                  className="ui-bits-preset-manager__delete"
                  onClick={(event) => handleDelete(event, preset)}
                  disabled={isDisabled || preset.readonly}
                  aria-label={`Delete preset ${preset.name}`}
                  title={preset.readonly ? "Built-in preset" : "Delete preset"}
                >
                  x
                </button>
              ) : null}
            </ListRow>
          );
        })}
      </ListSurface>
    </div>
  );
});

PresetManager.displayName = "PresetManager";

export default PresetManager;
