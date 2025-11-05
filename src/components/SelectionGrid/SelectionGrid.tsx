import React from "react";
import LFOSlider from "../LFOSlider";
import { flexoki } from "../../flexoki";
import {
  useSelectionGridActions,
  useSelectionGridState,
  type SelectionGridId,
} from "../../sliderStore";
import { DEFAULT_SELECTION_GRID_ID } from "../../selectionGridIds";
import {
  MATPLOTLIB_GRADIENTS,
  buildPalette,
  createGradientCss,
  type GradientDefinition,
} from "../../gradients/matplotlib";
import { CRATER_LAKE_HEIGHTMAP_SRC } from "./constants";

type PaletteInfo = {
  data: Uint8ClampedArray;
  css: string[];
};

type GradientBase = {
  name: string;
  stops: GradientDefinition["stops"];
  normal: PaletteInfo;
  inverted: PaletteInfo;
};

type GradientVisual = {
  name: string;
  normal: {
    textureUrl: string | null;
    paletteCss: string[];
    cssFallback: string;
  };
  inverted: {
    textureUrl: string | null;
    paletteCss: string[];
    cssFallback: string;
  };
};

const GRADIENT_BASE_DATA: GradientBase[] = MATPLOTLIB_GRADIENTS.map((definition) => ({
  name: definition.name,
  stops: definition.stops,
  normal: buildPalette(definition.stops, false),
  inverted: buildPalette(definition.stops, true),
}));

type HeightmapData = { data: Uint8Array; width: number; height: number };

function createTextureUrl(heightMap: Uint8Array, palette: Uint8ClampedArray, width: number, height: number): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.createImageData(width, height);
  const dest = imageData.data;
  for (let index = 0; index < heightMap.length; index += 1) {
    const value = heightMap[index];
    const srcOffset = value * 4;
    const destOffset = index * 4;
    dest[destOffset] = palette[srcOffset];
    dest[destOffset + 1] = palette[srcOffset + 1];
    dest[destOffset + 2] = palette[srcOffset + 2];
    dest[destOffset + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
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
  const [heightmap, setHeightmap] = React.useState<HeightmapData | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = CRATER_LAKE_HEIGHTMAP_SRC;
    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, width, height);
      const src = ctx.getImageData(0, 0, width, height).data;
      const values = new Uint8Array(width * height);
      for (let index = 0; index < values.length; index += 1) {
        const offset = index * 4;
        const r = src[offset];
        const g = src[offset + 1];
        const b = src[offset + 2];
        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        values[index] = gray;
      }
      setHeightmap({ data: values, width, height });
    };
    image.onerror = () => {
      if (!cancelled) setHeightmap(null);
    };
    return () => {
      cancelled = true;
    };
  }, []);

  const gradientVisuals = React.useMemo<GradientVisual[]>(() => GRADIENT_BASE_DATA.map((base) => {
    const normalTexture = heightmap
      ? createTextureUrl(heightmap.data, base.normal.data, heightmap.width, heightmap.height)
      : null;
    const invertedTexture = heightmap
      ? createTextureUrl(heightmap.data, base.inverted.data, heightmap.width, heightmap.height)
      : null;
    return {
      name: base.name,
      normal: {
        textureUrl: normalTexture,
        paletteCss: [...base.normal.css],
        cssFallback: createGradientCss(base.stops, false),
      },
      inverted: {
        textureUrl: invertedTexture,
        paletteCss: [...base.inverted.css],
        cssFallback: createGradientCss(base.stops, true),
      },
    };
  }), [heightmap]);

  const gradientCount = gradientVisuals.length;
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

  const paletteSignatureRef = React.useRef<string | null>(null);

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

  const selectedPalette = React.useMemo(() => {
    if (selectedIndex == null || gradientVisuals[selectedIndex] === undefined) return null;
    const visual = gradientVisuals[selectedIndex];
    return invertGradients ? visual.inverted.paletteCss : visual.normal.paletteCss;
  }, [gradientVisuals, invertGradients, selectedIndex]);

  React.useEffect(() => {
    if (!selectedPalette) return;
    const signature = selectedPalette.join("|");
    if (signature === paletteSignatureRef.current) return;
    paletteSignatureRef.current = signature;
    selectionGridActions.setSelectionGridPalette(gridId, selectedPalette);
  }, [gridId, selectedPalette, selectionGridActions]);

  const baseCellSize = Math.max(8, sliderBox.height || 0);
  const cellSizePx = baseCellSize * squareScale;
  const rowCapacity = sliderBox.width ? Math.max(1, Math.floor(sliderBox.width / cellSizePx)) : 1;
  const lastRowCount = rowCapacity >= gradientCount ? gradientCount : gradientCount % rowCapacity || rowCapacity;
  const leftoverSlots = rowCapacity > lastRowCount ? rowCapacity - lastRowCount : 0;
  const lastRowIndex = rowCapacity ? Math.floor((gradientCount - 1) / rowCapacity) : 0;
  const alignmentOffsetPx = leftoverSlots > 0
    ? squareAlignment === "center"
      ? (leftoverSlots * cellSizePx) / 2
      : squareAlignment === "right"
        ? leftoverSlots * cellSizePx
        : 0
    : 0;
  const containerWidthPx = rowCapacity * cellSizePx;

  const cells = gradientVisuals.map((visual, index) => {
    const row = rowCapacity ? Math.floor(index / rowCapacity) : 0;
    const col = rowCapacity ? index % rowCapacity : 0;
    const isLastRow = row === lastRowIndex;
    const marginLeft = isLastRow && col === 0 ? alignmentOffsetPx : 0;
    const isSelected = selectedIndex === index;
    const borderWidth = 1;
    const appearance = invertGradients ? visual.inverted : visual.normal;
    const backgroundImage = appearance.textureUrl ? `url(${appearance.textureUrl})` : appearance.cssFallback;
    return (
      <div
        key={visual.name}
        style={{
          width: `${cellSizePx}px`,
          height: `${cellSizePx}px`,
          flex: `0 0 ${cellSizePx}px`,
          border: `${borderWidth}px solid ${isSelected ? colorB : colorA}`,
          borderRadius: 3,
          boxSizing: "border-box",
          marginLeft,
          cursor: "pointer",
          outline: "none",
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
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

  const activeVisual = selectedIndex != null ? gradientVisuals[selectedIndex] : null;
  const previewGradient = selectedIndex != null
    ? createGradientCss(GRADIENT_BASE_DATA[selectedIndex].stops, invertGradients)
    : "none";

  const previewLabelBase = activeVisual ? activeVisual.name : "None";
  const previewLabel = activeVisual == null
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
              backgroundImage: previewGradient,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
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
