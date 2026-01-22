import React from "react";
import "./selectionGrid.css";

const CELL_CORNER_RADIUS_PX = 3;
const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";

export type SelectionGridAlignment = "left" | "center" | "right";

export type SelectionGridItemRenderState = {
  index: number;
  selected: boolean;
  size: number;
};

export type SelectionGridBaseProps = {
  layoutGap?: string;
  maxHeightUnits?: number;
  fontSize?: number;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export type SelectionGridGridProps<Item> = SelectionGridBaseProps & {
  items: Item[];
  getKey: (item: Item, index: number) => string;
  renderItem: (item: Item, state: SelectionGridItemRenderState) => React.ReactNode;
  getLabel?: (item: Item, index: number) => string;
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  onSelect?: (key: string | null, item: Item | null, index: number | null) => void;
  allowEmptySelection?: boolean;
  squareScale?: number;
  squareAlignment?: SelectionGridAlignment;
  colorA?: string;
  colorB?: string;
};

export type SelectionGridProps<Item = unknown> = SelectionGridGridProps<Item>;

export default function SelectionGrid<Item>(props: SelectionGridGridProps<Item>) {
  const {
    items,
    getKey,
    renderItem,
    getLabel,
    selectedKey,
    defaultSelectedKey = null,
    onSelect,
    allowEmptySelection = false,
    squareScale = 1,
    squareAlignment = "left",
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    layoutGap = "6px",
    maxHeightUnits = 24,
    fontSize,
    maxWidth = 360,
    className,
    style,
  } = props;

  const [internalSelectedKey, setInternalSelectedKey] = React.useState<string | null>(defaultSelectedKey);
  const isControlled = selectedKey !== undefined;
  const resolvedSelectedKey = isControlled ? selectedKey ?? null : internalSelectedKey;

  const resolvedSquareScale = Number.isFinite(squareScale) && squareScale > 0 ? squareScale : 1;
  const resolvedSquareAlignment = squareAlignment ?? "left";

  const itemKeys = React.useMemo(
    () => items.map((item, index) => getKey(item, index)),
    [getKey, items],
  );

  React.useEffect(() => {
    if (isControlled) return;
    if (resolvedSelectedKey == null) return;
    if (!itemKeys.includes(resolvedSelectedKey)) {
      setInternalSelectedKey(null);
    }
  }, [isControlled, itemKeys, resolvedSelectedKey]);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(360);

  React.useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width) return;
      const nextWidth = Math.round(rect.width);
      setContainerWidth((prev) => (Math.abs(prev - nextWidth) < 0.5 ? prev : nextWidth));
    };
    measure();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(node);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const previewFontSize = fontSize ?? 16;
  const previewLineHeight = 1;
  const previewPaddingEm = 0.35;
  const previewPaddingPx = previewFontSize * previewPaddingEm;
  const baseLabelHeight = previewFontSize * previewLineHeight;
  const baseCellSize = Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
    Math.round(previewFontSize + previewPaddingPx * 1.5),
  );
  const cellSizePx = baseCellSize * resolvedSquareScale;
  const gridCellCount = items.length;
  const rowCapacity = containerWidth ? Math.max(1, Math.floor(containerWidth / cellSizePx)) : 1;
  const rowCount = gridCellCount > 0 ? Math.ceil(gridCellCount / rowCapacity) : 0;
  const lastRowCount = gridCellCount === 0
    ? 0
    : rowCapacity >= gridCellCount
      ? gridCellCount
      : gridCellCount % rowCapacity || rowCapacity;
  const leftoverSlots = rowCapacity > lastRowCount ? rowCapacity - lastRowCount : 0;
  const lastRowIndex = gridCellCount === 0 ? 0 : Math.floor((gridCellCount - 1) / rowCapacity);
  const alignmentOffsetPx = leftoverSlots > 0
    ? resolvedSquareAlignment === "center"
      ? (leftoverSlots * cellSizePx) / 2
      : resolvedSquareAlignment === "right"
        ? leftoverSlots * cellSizePx
        : 0
    : 0;
  const containerWidthPx = rowCapacity * cellSizePx;

  const resolvedMaxHeightUnits = typeof maxHeightUnits === "number" && Number.isFinite(maxHeightUnits) && maxHeightUnits > 0
    ? maxHeightUnits
    : null;
  const totalRowUnits = rowCount * resolvedSquareScale;
  const gridMaxHeightPx = resolvedMaxHeightUnits != null ? resolvedMaxHeightUnits * baseCellSize : null;
  const clampGridHeight = resolvedMaxHeightUnits != null && totalRowUnits > resolvedMaxHeightUnits;

  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: resolvedMaxWidth,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: layoutGap,
    alignItems: "stretch",
    ...(style ?? {}),
  };

  const commitSelection = (key: string | null, item: Item | null, index: number | null) => {
    if (!isControlled) {
      setInternalSelectedKey(key);
    }
    onSelect?.(key, item, index);
  };

  const cells = items.map((item, index) => {
    const itemKey = itemKeys[index] ?? String(index);
    const row = rowCapacity ? Math.floor(index / rowCapacity) : 0;
    const col = rowCapacity ? index % rowCapacity : 0;
    const isLastRow = row === lastRowIndex;
    const marginLeft = isLastRow && col === 0 ? alignmentOffsetPx : 0;
    const isSelected = resolvedSelectedKey != null && itemKey === resolvedSelectedKey;
    const hasTopNeighbor = index - rowCapacity >= 0;
    const hasBottomNeighbor = index + rowCapacity < gridCellCount;
    const hasLeftNeighbor = col > 0;
    const hasRightNeighbor = col < rowCapacity - 1
      && index + 1 < gridCellCount
      && Math.floor((index + 1) / rowCapacity) === row;
    const topLeftRadius = (hasTopNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const topRightRadius = (hasTopNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const bottomLeftRadius = (hasBottomNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const bottomRightRadius = (hasBottomNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const borderRadiusValue = `${topLeftRadius}px ${topRightRadius}px ${bottomRightRadius}px ${bottomLeftRadius}px`;
    const label = getLabel?.(item, index);
    return (
      <div
        key={itemKey}
        style={{
          width: `${cellSizePx}px`,
          height: `${cellSizePx}px`,
          flex: `0 0 ${cellSizePx}px`,
          borderRadius: borderRadiusValue,
          boxSizing: "border-box",
          marginLeft,
          cursor: "pointer",
          outline: "none",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "stretch",
          color: colorA,
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={label}
        title={label}
        onClick={() => {
          if (isSelected) {
            if (allowEmptySelection) {
              commitSelection(null, null, null);
            }
            return;
          }
          commitSelection(itemKey, item, index);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isSelected) {
              if (allowEmptySelection) {
                commitSelection(null, null, null);
              }
              return;
            }
            commitSelection(itemKey, item, index);
          }
        }}
      >
        <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
          {renderItem(item, { index, selected: isSelected, size: cellSizePx })}
        </div>
        {isSelected ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: borderRadiusValue,
              boxShadow: `inset 0 0 0 2px ${colorB}`,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </div>
    );
  });

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: `${containerWidthPx}px`,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            className="selection-grid__cells"
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              gap: 0,
              alignContent: "flex-start",
              width: "100%",
              ...(gridMaxHeightPx != null
                ? {
                  maxHeight: `${gridMaxHeightPx}px`,
                  overflowY: clampGridHeight ? "auto" : undefined,
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }
                : {}),
            }}
          >
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
}
