import React from "react";
import { usePanelTheme } from "../../panelGap";
import "./key-value-rows.css";

export type KeyValueRowsBorderStyle = "a" | "b" | "none";

export interface KeyValueRowsRow {
  key?: string;
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface KeyValueRowsProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: KeyValueRowsRow[];
  emptyLabel?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  borderStyle?: KeyValueRowsBorderStyle;
  borderRadius?: number;
  fontSize?: number;
  rowHeight?: number;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function computeRowHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const KeyValueRows = React.forwardRef<HTMLDivElement, KeyValueRowsProps>((props, ref) => {
  const {
    rows,
    emptyLabel = "No data",
    colorA,
    colorB,
    borderStyle,
    borderRadius,
    fontSize,
    rowHeight,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const surfaceColor = resolvedBorderStyle === "b" ? resolvedColorA : resolvedColorB;
  const textColor = resolvedBorderStyle === "b" ? resolvedColorB : resolvedColorA;
  const resolvedBorderColor = resolvedBorderStyle === "none" ? "transparent" : textColor;
  const borderValue = resolvedBorderStyle === "none"
    ? "1px solid transparent"
    : `1px solid ${resolvedBorderColor}`;
  const resolvedRadius = Math.max(0, borderRadius ?? 3);
  const resolvedRowHeight = Math.max(1, Math.round(rowHeight ?? computeRowHeight(resolvedFontSize)));
  const paddingX = Math.round(resolvedFontSize * 0.7);

  return (
    <div
      ref={ref}
      className={["ui-bits-key-value-rows", className].filter(Boolean).join(" ")}
      style={{
        fontFamily: "inherit",
        fontSize: resolvedFontSize,
        lineHeight: 1,
        color: textColor,
        background: surfaceColor,
        border: borderValue,
        borderRadius: resolvedRadius,
        boxSizing: "border-box",
        "--ui-bits-key-value-rows-row-height": `${resolvedRowHeight}px`,
        "--ui-bits-key-value-rows-padding-x": `${paddingX}px`,
        "--ui-bits-key-value-rows-border-color": resolvedBorderColor,
        ...(style ?? {}),
      } as React.CSSProperties}
      {...rest}
    >
      {rows.length > 0 ? rows.map((row, index) => (
        <div
          key={row.key ?? `${index}`}
          className="ui-bits-key-value-rows__row"
        >
          <span className="ui-bits-key-value-rows__label">{row.label}</span>
          <span className="ui-bits-key-value-rows__value">{row.value}</span>
        </div>
      )) : (
        <div className="ui-bits-key-value-rows__row ui-bits-key-value-rows__row--empty">
          {emptyLabel}
        </div>
      )}
    </div>
  );
});

KeyValueRows.displayName = "KeyValueRows";

export default KeyValueRows;
