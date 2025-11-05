import React from "react";
import LFOSlider from "../LFOSlider";
import { flexoki } from "../../flexoki";
import {
  DEFAULT_SELECTION_GRID_ID,
  useSelectionGridActions,
  useSelectionGridState,
  type SelectionGridId,
} from "../../sliderStore";

type GradientStop = { color: string; stop: number };

const MATPLOTLIB_GRADIENTS: Array<{ name: string; stops: GradientStop[] }> = [
  {
    name: "Viridis",
    stops: [
      { color: "#440154", stop: 0 },
      { color: "#3b528b", stop: 25 },
      { color: "#21918c", stop: 50 },
      { color: "#5ec962", stop: 75 },
      { color: "#fde725", stop: 100 },
    ],
  },
  {
    name: "Plasma",
    stops: [
      { color: "#0d0887", stop: 0 },
      { color: "#7e03a8", stop: 25 },
      { color: "#cc4778", stop: 50 },
      { color: "#f89441", stop: 75 },
      { color: "#f0f921", stop: 100 },
    ],
  },
  {
    name: "Inferno",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#420a68", stop: 25 },
      { color: "#932667", stop: 50 },
      { color: "#dd513a", stop: 75 },
      { color: "#fba40a", stop: 100 },
    ],
  },
  {
    name: "Magma",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#3b0f70", stop: 20 },
      { color: "#8c2981", stop: 40 },
      { color: "#de4968", stop: 65 },
      { color: "#fe9f6d", stop: 85 },
      { color: "#fcfdbf", stop: 100 },
    ],
  },
  {
    name: "Cividis",
    stops: [
      { color: "#00204c", stop: 0 },
      { color: "#2d708e", stop: 35 },
      { color: "#a2a929", stop: 70 },
      { color: "#f9f7a5", stop: 100 },
    ],
  },
  {
    name: "Turbo",
    stops: [
      { color: "#30123b", stop: 0 },
      { color: "#4145ab", stop: 20 },
      { color: "#4686f4", stop: 40 },
      { color: "#38bf6b", stop: 60 },
      { color: "#d7e21c", stop: 80 },
      { color: "#fca107", stop: 90 },
      { color: "#d62f27", stop: 100 },
    ],
  },
  {
    name: "Twilight",
    stops: [
      { color: "#e2d9ff", stop: 0 },
      { color: "#b8a0ff", stop: 15 },
      { color: "#8469f0", stop: 30 },
      { color: "#5b3fa8", stop: 45 },
      { color: "#3b1f65", stop: 60 },
      { color: "#5a375e", stop: 70 },
      { color: "#8c675d", stop: 80 },
      { color: "#c39d6a", stop: 90 },
      { color: "#f1d9a7", stop: 100 },
    ],
  },
  {
    name: "Coolwarm",
    stops: [
      { color: "#3b4cc0", stop: 0 },
      { color: "#6f92f3", stop: 25 },
      { color: "#f7f7f7", stop: 50 },
      { color: "#f49d7c", stop: 75 },
      { color: "#b40426", stop: 100 },
    ],
  },
  {
    name: "Spectral",
    stops: [
      { color: "#9e0142", stop: 0 },
      { color: "#f46d43", stop: 20 },
      { color: "#fee08b", stop: 40 },
      { color: "#e6f598", stop: 60 },
      { color: "#66c2a5", stop: 80 },
      { color: "#5e4fa2", stop: 100 },
    ],
  },
  {
    name: "Rainbow",
    stops: [
      { color: "#6e40aa", stop: 0 },
      { color: "#4178d4", stop: 20 },
      { color: "#1fa187", stop: 40 },
      { color: "#73d055", stop: 60 },
      { color: "#fde725", stop: 80 },
      { color: "#f97306", stop: 100 },
    ],
  },
  {
    name: "Monochrome",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Flexoki Monochrome",
    stops: [
      { color: "#100F0F", stop: 0 },
      { color: "#FFFCF0", stop: 100 },
    ],
  },
];

function buildGradient(stops: GradientStop[], invert: boolean): string {
  const orderedStops = invert
    ? stops
        .slice()
        .reverse()
        .map(({ color, stop }) => ({ color, stop: 100 - stop }))
    : stops;
  return `linear-gradient(90deg, ${orderedStops.map(({ color, stop }) => `${color} ${stop}%`).join(", ")})`;
}

export type SelectionGridProps = {
  gridId?: SelectionGridId;
  previewDarkMode: boolean;
  layoutGap: string;
  colorA: string;
  colorB: string;
  textColor: string;
  allowEmptySelection?: boolean;
};

export default function SelectionGrid({
  gridId = DEFAULT_SELECTION_GRID_ID,
  previewDarkMode,
  layoutGap,
  colorA,
  colorB,
  textColor,
  allowEmptySelection = false,
}: SelectionGridProps) {
  const gridCellCount = MATPLOTLIB_GRADIENTS.length;
  const sliderContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [sliderBox, setSliderBox] = React.useState<{ width: number; height: number }>({ width: 260, height: 48 });
  const selectionGridState = useSelectionGridState(gridId);
  const selectionGridActions = useSelectionGridActions();
  const {
    squareScale,
    squareAlignment,
    selectedIndex,
    invertGradients,
    allowEmptySelection: stateAllowEmptySelection,
  } = selectionGridState;

  React.useEffect(() => {
    selectionGridActions.registerSelectionGrid(gridId, { allowEmptySelection });
  }, [gridId, allowEmptySelection, selectionGridActions]);

  React.useEffect(() => {
    if (allowEmptySelection !== undefined && stateAllowEmptySelection !== allowEmptySelection) {
      selectionGridActions.setSelectionGridAllowEmpty(gridId, allowEmptySelection);
    }
  }, [allowEmptySelection, gridId, selectionGridActions, stateAllowEmptySelection]);

  React.useEffect(() => {
    const node = sliderContainerRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width && rect.height) {
        setSliderBox((prev) => {
          const nextWidth = Math.round(rect.width);
          const nextHeight = Math.round(rect.height);
          if (prev.width === nextWidth && prev.height === nextHeight) return prev;
          return { width: nextWidth, height: nextHeight };
        });
      }
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

  const baseCellSize = Math.max(8, sliderBox.height || 0);
  const cellSizePx = baseCellSize * squareScale;
  const rowCapacity = sliderBox.width ? Math.max(1, Math.floor(sliderBox.width / cellSizePx)) : 1;
  const lastRowCount = rowCapacity >= gridCellCount ? gridCellCount : gridCellCount % rowCapacity || rowCapacity;
  const leftoverSlots = rowCapacity > lastRowCount ? rowCapacity - lastRowCount : 0;
  const lastRowIndex = rowCapacity ? Math.floor((gridCellCount - 1) / rowCapacity) : 0;
  const alignmentOffsetPx =
    leftoverSlots > 0
      ? squareAlignment === "center"
        ? (leftoverSlots * cellSizePx) / 2
        : squareAlignment === "right"
          ? leftoverSlots * cellSizePx
          : 0
      : 0;
  const containerWidthPx = rowCapacity * cellSizePx;

  const cells = MATPLOTLIB_GRADIENTS.map((swatch, index) => {
    const row = rowCapacity ? Math.floor(index / rowCapacity) : 0;
    const col = rowCapacity ? index % rowCapacity : 0;
    const isLastRow = row === lastRowIndex;
    const marginLeft = isLastRow && col === 0 ? alignmentOffsetPx : 0;
    const isSelected = selectedIndex === index;
    const borderWidth = isSelected ? 2 : 1;
    const background = buildGradient(swatch.stops, invertGradients);
    return (
      <div
        key={swatch.name}
        style={{
          width: `${cellSizePx}px`,
          height: `${cellSizePx}px`,
          flex: `0 0 ${cellSizePx}px`,
          background,
          border: `${borderWidth}px solid ${isSelected ? colorB : colorA}`,
          borderRadius: 3,
          boxSizing: "border-box",
          marginLeft,
          cursor: "pointer",
          outline: "none",
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={() => {
          if (selectedIndex === index) {
            if (stateAllowEmptySelection) {
              selectionGridActions.setSelectionGridSelectedIndex(gridId, null);
            }
            return;
          }
          selectionGridActions.setSelectionGridSelectedIndex(gridId, index);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectedIndex === index) {
              if (stateAllowEmptySelection) {
                selectionGridActions.setSelectionGridSelectedIndex(gridId, null);
              }
              return;
            }
            selectionGridActions.setSelectionGridSelectedIndex(gridId, index);
          }
        }}
      />
    );
  });

  const wrapperStyle: React.CSSProperties = {
    width: "min(80vw, 360px)",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: layoutGap,
    alignItems: "stretch",
  };

  const alignmentOptions: Array<{ value: "left" | "center" | "right"; label: string }> = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

  const alignmentButtonStyle: React.CSSProperties = {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colorA,
    background: previewDarkMode ? flexoki.base["900"] : flexoki.base["50"],
    color: previewDarkMode ? flexoki.base["200"] : flexoki.base["600"],
    padding: "0.25rem 0.75rem",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };

  const alignmentButtonActiveStyle: React.CSSProperties = {
    background: colorB,
    color: "#ffffff",
    borderColor: colorB,
  };

  const activeGradient = selectedIndex != null ? MATPLOTLIB_GRADIENTS[selectedIndex] : null;
  const previewGradient = activeGradient ? buildGradient(activeGradient.stops, invertGradients) : "transparent";
  const previewLabelBase = activeGradient ? activeGradient.name : "None";
  const previewLabel =
    activeGradient == null
      ? previewLabelBase
      : invertGradients
        ? `<-${previewLabelBase}-<`
        : `>-${previewLabelBase}->`;

  return (
    <div style={wrapperStyle}>
      <div ref={sliderContainerRef} style={{ width: "100%" }}>
        <LFOSlider
          label="Square Size"
          min={1}
          max={4}
          step={1}
          defaultValue={squareScale}
          width={sliderBox.width}
          drawerFeatureEnabled={false}
          drawerHandle={false}
          mode="external"
          readExternal={() => squareScale}
          leftColor={previewDarkMode ? flexoki.base["400"] : flexoki.base["200"]}
          rightColor={previewDarkMode ? flexoki.base["900"] : flexoki.base["50"]}
          onUserChange={(value: number) => {
            selectionGridActions.setSelectionGridSquareScale(gridId, value);
          }}
          onAnimatedUpdate={(value: number) => {
            selectionGridActions.setSelectionGridSquareScale(gridId, value);
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {alignmentOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectionGridActions.setSelectionGridAlignment(gridId, option.value)}
            aria-pressed={squareAlignment === option.value}
            style={{
              ...alignmentButtonStyle,
              ...(squareAlignment === option.value ? alignmentButtonActiveStyle : {}),
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: `${containerWidthPx}px`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${baseCellSize}px`,
              borderRadius: 3,
              border: `1px solid ${colorA}`,
              boxSizing: "border-box",
              background: previewGradient,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: textColor,
              fontSize: Math.max(12, baseCellSize * 0.4),
              fontWeight: 600,
              textTransform: "capitalize",
              textShadow: [
                "0 0 4px rgba(0, 0, 0, 0.7)",
                "0 1px 3px rgba(0, 0, 0, 0.85)",
              ].join(", "),
              userSelect: "none",
            }}
            aria-label="Selected gradient preview"
            role="button"
            tabIndex={0}
            aria-pressed={invertGradients}
            onClick={() => {
              selectionGridActions.toggleSelectionGridInvert(gridId);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectionGridActions.toggleSelectionGridInvert(gridId);
              }
            }}
          >
            {previewLabel}
          </div>
          <div
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              gap: 0,
              alignContent: "flex-start",
              width: "100%",
            }}
          >
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
}
