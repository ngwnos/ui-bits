import React from "react";
import { Circle, CircleDot } from "lucide-react";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
import ListRow from "../ListRow";
import ListSurface from "../ListSurface";
import "./radiolist.css";

export interface RadioListOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export type RadioListBorderStyle = "a" | "b" | "none";

export interface RadioListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  showLabel?: boolean;
  ariaLabel?: string;
  options: RadioListOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: RadioListOption, index: number) => void;
  emptyLabel?: string;
  columns?: number;
  maxListHeight?: number | string;
  colorA?: string;
  colorB?: string;
  borderStyle?: RadioListBorderStyle;
  fontSize?: number;
  width?: number | string;
  disabled?: boolean;
  controlId?: string;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
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

function resolveInitialValue(
  options: RadioListOption[],
  defaultValue?: string,
  value?: string,
) {
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  return options.find((option) => !option.disabled)?.value ?? "";
}

function findNextEnabledIndex(
  options: RadioListOption[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (!options.length) return -1;
  for (let step = 1; step <= options.length; step += 1) {
    const index = (startIndex + direction * step + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

function findEdgeEnabledIndex(options: RadioListOption[], fromEnd: boolean) {
  if (!options.length) return -1;
  if (!fromEnd) {
    return options.findIndex((option) => !option.disabled);
  }
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

const RadioList = React.forwardRef<HTMLDivElement, RadioListProps>((props, ref) => {
  const {
    label,
    showLabel = false,
    ariaLabel,
    options,
    value,
    defaultValue,
    onChange,
    emptyLabel = "No options",
    columns = 1,
    maxListHeight,
    colorA,
    colorB,
    borderStyle,
    fontSize,
    width,
    disabled = false,
    controlId,
    className,
    style,
    ...rest
  } = props;

  const panelTheme = usePanelTheme();
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedBorderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const resolvedAriaLabel = ariaLabel ?? label;
  const resolvedControlId = useResolvedControlId(controlId, label, resolvedAriaLabel);
  const [storeValue, setStoreValue] = useControlValue<string>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const rowHeight = computeRowHeight(resolvedFontSize);
  const paddingX = Math.round(resolvedFontSize * 0.7);
  const resolvedMaxListHeight = resolveSize(maxListHeight) ?? `${rowHeight * 8}px`;
  const resolvedWidth = resolveSize(width);
  const resolvedColumns = Number.isFinite(columns) && columns > 0
    ? Math.floor(columns)
    : 1;
  const isControlled = resolvedValueProp !== undefined;
  const [internalValue, setInternalValue] = React.useState<string>(() => (
    resolveInitialValue(options, defaultValue, resolvedValueProp)
  ));
  const currentValue = isControlled ? resolvedValueProp ?? "" : internalValue;
  const selectedIndex = React.useMemo(() => (
    options.findIndex((option) => option.value === currentValue)
  ), [currentValue, options]);
  const firstEnabledIndex = React.useMemo(() => (
    findEdgeEnabledIndex(options, false)
  ), [options]);
  const rowRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  rowRefs.current.length = options.length;

  React.useEffect(() => {
    if (isControlled) return;
    if (!options.length) {
      if (internalValue !== "") setInternalValue("");
      return;
    }
    const hasEnabled = options.some((option) => !option.disabled);
    if (!hasEnabled) {
      if (internalValue !== "") setInternalValue("");
      return;
    }
    const existsAndEnabled = options.some((option) => (
      option.value === internalValue && !option.disabled
    ));
    if (!existsAndEnabled) {
      setInternalValue(resolveInitialValue(options, defaultValue));
    }
  }, [defaultValue, internalValue, isControlled, options]);

  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(resolveInitialValue(options, defaultValue, resolvedValueProp));
  }, [defaultValue, options, resolvedValueProp, setStoreValue, shouldUseStore, storeValue]);

  const handleSelectIndex = React.useCallback((index: number) => {
    if (disabled) return;
    const option = options[index];
    if (!option || option.disabled) return;
    if (option.value === currentValue) return;
    if (!isControlled) {
      setInternalValue(option.value);
    }
    if (shouldUseStore) {
      setStoreValue(option.value);
    }
    onChange?.(option.value, option, index);
  }, [currentValue, disabled, isControlled, onChange, options, setStoreValue, shouldUseStore]);

  const handleOptionKeyDown = React.useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (disabled) return;
    if (!options.length) return;
    let targetIndex = -1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      targetIndex = findNextEnabledIndex(options, index, 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      targetIndex = findNextEnabledIndex(options, index, -1);
    } else if (event.key === "Home") {
      targetIndex = findEdgeEnabledIndex(options, false);
    } else if (event.key === "End") {
      targetIndex = findEdgeEnabledIndex(options, true);
    }
    if (targetIndex < 0) return;
    event.preventDefault();
    handleSelectIndex(targetIndex);
    rowRefs.current[targetIndex]?.focus();
  }, [disabled, handleSelectIndex, options]);

  return (
    <div
      ref={ref}
      className={["ui-bits-radio-list", className].filter(Boolean).join(" ")}
      style={{
        ...(style ?? {}),
        width: resolvedWidth ?? "100%",
        "--ui-bits-list-max-height": resolvedMaxListHeight,
        "--ui-bits-list-row-min-height": `${rowHeight}px`,
        "--ui-bits-list-gap": "2px",
        "--ui-bits-list-scrollbar-color": resolvedColorA,
        "--ui-bits-list-row-height": `${rowHeight}px`,
        "--ui-bits-list-row-padding-x": `${paddingX}px`,
        "--ui-bits-list-row-color-a": resolvedBorderColor,
        "--ui-bits-list-row-color-b": resolvedColorB,
        "--ui-bits-radio-list-active-bg": resolvedColorA,
        "--ui-bits-radio-list-active-color": resolvedColorB,
        "--ui-bits-radio-list-active-border": resolvedBorderColor,
        color: resolvedColorA,
        fontSize: resolvedFontSize,
      } as React.CSSProperties}
      {...rest}
    >
      {showLabel && label ? (
        <div className="ui-bits-radio-list__label">{label}</div>
      ) : null}
      <div
        className="ui-bits-radio-list__group"
        role="radiogroup"
        aria-label={resolvedAriaLabel}
        aria-disabled={disabled || undefined}
      >
        <ListSurface
          className="ui-bits-radio-list__surface"
          listClassName="ui-bits-radio-list__list"
          columns={resolvedColumns}
          isEmpty={options.length === 0}
          emptyState={emptyLabel}
        >
          {options.map((option, index) => {
            const isOptionDisabled = disabled || option.disabled === true;
            const isActive = option.value === currentValue;
            const tabIndex = isOptionDisabled
              ? -1
              : isActive || (selectedIndex < 0 && index === firstEnabledIndex)
                ? 0
                : -1;
            return (
              <ListRow
                key={option.value}
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                role="radio"
                aria-checked={isActive}
                className="ui-bits-radio-list__item"
                active={isActive}
                disabled={isOptionDisabled}
                tabIndex={tabIndex}
                onSelect={() => handleSelectIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                {isActive ? (
                  <CircleDot className="ui-bits-radio-list__icon" aria-hidden="true" />
                ) : (
                  <Circle className="ui-bits-radio-list__icon" aria-hidden="true" />
                )}
                <span className="ui-bits-radio-list__content">
                  <span className="ui-bits-radio-list__name">{option.label}</span>
                  {option.description ? (
                    <span className="ui-bits-radio-list__description">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </ListRow>
            );
          })}
        </ListSurface>
      </div>
    </div>
  );
});

RadioList.displayName = "RadioList";

export default RadioList;
