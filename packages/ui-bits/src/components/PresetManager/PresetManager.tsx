import React from "react";
import { usePanelTheme } from "../../panelGap";
import { usePresetStore } from "../../presetStore";
import IconButton from "../IconButton";
import { Save } from "lucide-react";
import TextInput from "../TextInput";
import "./preset-manager.css";

export interface PresetManagerPreset {
  id?: string;
  name: string;
  readonly?: boolean;
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
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = React.useState(() => ({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  }));
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<number | null>(null);

  const updateScrollMetrics = React.useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    const next = {
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    };
    setScrollMetrics((prev) => {
      if (
        prev.scrollTop === next.scrollTop &&
        prev.scrollHeight === next.scrollHeight &&
        prev.clientHeight === next.clientHeight
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const handleListScroll = React.useCallback(() => {
    updateScrollMetrics();
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 650);
  }, [updateScrollMetrics]);

  React.useLayoutEffect(() => {
    updateScrollMetrics();
  }, [updateScrollMetrics, resolvedPresets.length, resolvedMaxListHeight, resolvedFontSize]);

  React.useEffect(() => {
    const node = listRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollMetrics());
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateScrollMetrics]);
  React.useEffect(() => (
    () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    }
  ), []);

  const hasOverflow = scrollMetrics.scrollHeight - scrollMetrics.clientHeight > 1;
  const thumbHeight = hasOverflow
    ? Math.max(12, Math.round(scrollMetrics.clientHeight * (scrollMetrics.clientHeight / scrollMetrics.scrollHeight)))
    : 0;
  const maxThumbTop = Math.max(0, scrollMetrics.clientHeight - thumbHeight);
  const thumbTop = hasOverflow && scrollMetrics.scrollHeight > scrollMetrics.clientHeight
    ? Math.round((scrollMetrics.scrollTop / (scrollMetrics.scrollHeight - scrollMetrics.clientHeight)) * maxThumbTop)
    : 0;

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
      </div>
      <div
        className={[
          "ui-bits-preset-manager__list-wrap",
          isScrolling ? "ui-bits-preset-manager__list-wrap--scrolling" : "",
        ].filter(Boolean).join(" ")}
      >
        <div
          ref={listRef}
          className="ui-bits-preset-manager__list"
          role="list"
          onScroll={handleListScroll}
        >
          {resolvedPresets.length === 0 ? (
            <div className="ui-bits-preset-manager__empty">{emptyLabel}</div>
          ) : (
            resolvedPresets.map((preset) => {
              const isDisabled = disabled;
              return (
                <div
                  key={preset.id ?? preset.name}
                  className="ui-bits-preset-manager__item"
                  onClick={() => handleSelect(preset)}
                  onKeyDown={(event) => {
                    if (isDisabled) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    handleSelect(preset);
                  }}
                  role="listitem"
                  tabIndex={isDisabled ? -1 : 0}
                  aria-disabled={isDisabled}
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
                </div>
              );
            })
          )}
        </div>
        {hasOverflow ? (
          <div className="ui-bits-preset-manager__scrollbar" aria-hidden="true">
            <div
              className="ui-bits-preset-manager__scrollbar-thumb"
              style={{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

PresetManager.displayName = "PresetManager";

export default PresetManager;
