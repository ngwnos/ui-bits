import React from "react";
import { Dice6, Plus } from "lucide-react";
import { usePanelTheme } from "../../panelGap";
import IconButton from "../IconButton";
import TextInput from "../TextInput";
import "./name-input-row.css";

export type NameInputRowBorderStyle = "a" | "b" | "none";
export type NameInputRowRandomizeMode = "replace" | "append";

export interface NameInputRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onCreate?: (name: string) => void | Promise<void>;
  onRandomize?: () => string | Promise<string>;
  placeholder?: string;
  createLabel?: string;
  randomizeLabel?: string;
  inputAriaLabel?: string;
  clearOnCreate?: boolean;
  randomizeMode?: NameInputRowRandomizeMode;
  appendSeparator?: string;
  normalize?: (value: string) => string;
  colorA?: string;
  colorB?: string;
  borderStyle?: NameInputRowBorderStyle;
  fontSize?: number;
  disabled?: boolean;
}

const FALLBACK_COLOR_A = "#f0f0f0";
const FALLBACK_COLOR_B = "#2f2f2f";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function computeRowHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const defaultNormalize = (value: string) => value.trim();

const NameInputRow = React.forwardRef<HTMLDivElement, NameInputRowProps>((props, ref) => {
  const {
    value,
    defaultValue = "",
    onValueChange,
    onCreate,
    onRandomize,
    placeholder = "Name...",
    createLabel = "Create",
    randomizeLabel = "Randomize",
    inputAriaLabel = "Name",
    clearOnCreate = true,
    randomizeMode = "replace",
    appendSeparator = " ",
    normalize = defaultNormalize,
    colorA,
    colorB,
    borderStyle = "a",
    fontSize,
    disabled = false,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isRandomizing, setIsRandomizing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;
  const rowHeight = computeRowHeight(resolvedFontSize);
  const paddingY = Math.round(resolvedFontSize * SLIDER_PAD_Y_EM);
  const paddingX = Math.round(resolvedFontSize * 0.7);
  const normalizedValue = normalize(resolvedValue);
  const isBusy = isCreating || isRandomizing;
  const canCreate = !disabled && !isBusy && Boolean(onCreate) && normalizedValue.length > 0;
  const canRandomize = !disabled && !isBusy && Boolean(onRandomize);

  const commitValue = React.useCallback((nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange]);

  const handleValueChange: React.ChangeEventHandler<HTMLInputElement> = React.useCallback((event) => {
    commitValue(event.target.value);
  }, [commitValue]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate || !onCreate) return;
    setIsCreating(true);
    try {
      await onCreate(normalizedValue);
      if (clearOnCreate) {
        commitValue("");
      }
    } finally {
      setIsCreating(false);
    }
  }, [canCreate, clearOnCreate, commitValue, normalizedValue, onCreate]);

  const handleRandomize = React.useCallback(async () => {
    if (!canRandomize || !onRandomize) return;
    setIsRandomizing(true);
    try {
      const generatedValue = await onRandomize();
      if (typeof generatedValue !== "string" || generatedValue.length === 0) return;
      const currentRawValue = inputRef.current?.value ?? resolvedValue;
      if (randomizeMode === "append") {
        const hasPrefix = currentRawValue.length > 0;
        const nextValue = hasPrefix
          ? `${currentRawValue}${appendSeparator}${generatedValue}`
          : generatedValue;
        commitValue(nextValue);
        return;
      }
      commitValue(generatedValue);
    } finally {
      setIsRandomizing(false);
    }
  }, [appendSeparator, canRandomize, commitValue, onRandomize, randomizeMode, resolvedValue]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = React.useCallback((event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleCreate();
  }, [handleCreate]);

  return (
    <div
      ref={ref}
      className={["ui-bits-name-input-row", className].filter(Boolean).join(" ")}
      style={{
        color: resolvedColorA,
        fontSize: resolvedFontSize,
        ...(style ?? {}),
      }}
      {...rest}
    >
      <TextInput
        ref={inputRef}
        value={resolvedValue}
        onChange={handleValueChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="ui-bits-name-input-row__input"
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        borderStyle={borderStyle}
        fontSize={resolvedFontSize}
        padding={`${paddingY}px ${paddingX}px`}
        style={{ height: rowHeight, flex: 1, minWidth: 0 }}
        disabled={disabled}
        aria-label={inputAriaLabel}
      />
      {onRandomize ? (
        <IconButton
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle={borderStyle}
          fontSize={resolvedFontSize}
          behavior="momentary"
          disabled={!canRandomize}
          onClick={() => {
            void handleRandomize();
          }}
          aria-label={randomizeLabel}
          title={randomizeLabel}
        >
          <Dice6 />
        </IconButton>
      ) : null}
      <IconButton
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        borderStyle={borderStyle}
        fontSize={resolvedFontSize}
        behavior="momentary"
        disabled={!canCreate}
        onClick={() => {
          void handleCreate();
        }}
        aria-label={createLabel}
        title={createLabel}
      >
        <Plus />
      </IconButton>
    </div>
  );
});

NameInputRow.displayName = "NameInputRow";

export default NameInputRow;
