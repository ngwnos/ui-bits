# SelectionGrid

Canvas-rendered thumbnail pickers. Two components share one rendering core (`selectionGridCanvas.ts` + `selectionGrid.worker.ts`) but have entirely different state models:

| | `SelectionGrid` | `GradientSelectionGrid` |
|---|---|---|
| Items | caller-supplied (`items` / `folders`) | fixed matplotlib gradient set (`MATPLOTLIB_GRADIENTS`) |
| State | props (controlled or uncontrolled) | internal selection-grid store (`sliderStore`) |
| Selection | single key, or multi-slot via `selectionSlots` | single index in store |

Exports (from `./index.ts`, re-exported via `core.ts`): `SelectionGrid` (default), `GradientSelectionGrid`, types `SelectionGridProps` / `SelectionGridGridProps`, `SelectionGridSelectionSlot`, `SelectionGridPreview`, `SelectionGridAlignment`, `SelectionGridGradientProps`, `TerrainTileAsset`. Exception: `SelectionGridFolder` is exported from `./index.ts` only — `core.ts` does not re-export it, so it is not importable from the package entry.

## Rendering design

Both components paint into a single sticky `<canvas>` inside a scroll container; only rows intersecting the viewport (±1 row) are drawn per frame, so paint cost tracks the viewport, not item count (each frame still walks all entries to compute tile keys and the atlas signature, so that part is O(n)). Tile pixels are produced off-thread by an inline worker (`?worker&inline` — no separate worker asset to serve) that fetches/decodes images or synthesizes gradient/terrain previews and posts back transferable `ImageBitmap`s. Ready bitmaps are blitted into a signature-keyed atlas canvas (`targetSize|columns|tileKeys...`); any change to the tile set, DPR, or cell size invalidates the atlas and evicts stale cache entries. Worker requests flow through a queue bounded to `MAX_TILE_INFLIGHT` (6) concurrent jobs; completions trigger an rAF-coalesced redraw (`requestRender`).

## `SelectionGrid<Item>` (props-driven)

Required props: `getKey(item, index)` and `getPreview(item, index)` (returns `{ type: "color", color }` or `{ type: "image", src }`). Provide items via `items` **or** `folders` (`SelectionGridFolder[]`: collapsible sections with per-folder colors and an optional `addTile` file-upload cell).

```tsx
import { SelectionGrid } from "ui-bits";

<SelectionGrid
  items={textures}
  getKey={(t) => t.id}
  getPreview={(t) => ({ type: "image", src: t.thumbUrl })}
  selectedKey={selected}            // omit for uncontrolled (defaultSelectedKey)
  onSelect={(key, item, index) => setSelected(key)}
  allowEmptySelection
/>
```

- **Single select** — controlled iff `selectedKey !== undefined`; otherwise internal state seeded from `defaultSelectedKey`. Clicking the selected cell deselects only when `allowEmptySelection`.
- **Multi select** — pass `selectionSlots: SelectionGridSelectionSlot[]` (`{ id, color, selectedKey?, defaultSelectedKey?, onSelect? }`). Each slot is independently controlled/uncontrolled. Clicking an unassigned item fills the first empty slot, else round-robins from the last-assigned slot; clicking an assigned item clears its slot only when `allowEmptySelection`. Selected cells get a 2px outline in the slot's `color`. Slot-outline repaint on selection change is immediate (recently fixed — `slotByKey` is in the redraw effect deps); if outlines ever lag, check that dependency list first.
- When `selectionSlots` is non-empty, top-level `selectedKey`/`onSelect` are ignored.
- Customization: `squareScale`, `squareAlignment` (`"left" | "center" | "right"`), `colorA`/`colorB` (fallback fill / selection stroke), `maxHeightUnits` (scroll clamp in base-cell units, default 24), `maxWidth` (default 360), `fontSize`, `layoutGap`, `className`, `style`.

## `GradientSelectionGrid`

Palette picker over the built-in matplotlib gradients, with two preview modes: flat gradient ramps, or host-supplied terrain tiles recolored through the palette (grayscale luminance → palette lookup, done in the worker).

```tsx
import { GradientSelectionGrid } from "ui-bits";

<GradientSelectionGrid previewDarkMode={false} terrainAssets={loadTiles} />
```

`previewDarkMode` is the only required prop (currently it only re-triggers label measurement). No provider setup is needed: the component auto-mounts its own `SliderStoreProvider` when none exists in context.

### State lives in the selection-grid store — NOT in controlStore

Selection (`selectedIndex`), `invertGradients`, `previewMode`, `squareScale`/`squareAlignment`, the derived 256-entry `colorPalette`, and sun angles live in the internal selection-grid store (`sliderStore`, keyed by the `gridId` prop, default `DEFAULT_SELECTION_GRID_ID`). **This store is completely separate from `controlStore`: gradient selection, invert, and preview mode are NOT captured or restored by controlStore presets, and the store is in-memory only (no persistence).** Read/write it with `useSelectionGridState(gridId)` and `useSelectionGridActions()` from the same provider subtree — but note that if the component auto-mounted its own provider, outside code cannot reach that store; mount a shared `SliderStoreProvider` above both if external code needs access.

Interactions: click a cell → `setSelectionGridSelectedIndex`; click the header preview bar → `toggleSelectionGridInvert`; the header icon button cycles `previewMode` (`"gradient"` ⇄ `"terrainHeight"`). The active palette is written back to the store via `setSelectionGridPalette` so consumers (e.g. shaders) can read `colorPalette` reactively. The `allowEmptySelection` prop is synced into store state on mount/change.

### Terrain assets contract

`terrainAssets?: TerrainTileAsset[] | (() => Promise<TerrainTileAsset[]>)` where `TerrainTileAsset = { name: string; url: string }`. Tiles are grayscale heightmap images; URLs are resolved against `window.location.href` and fetched inside the worker (`cache: "force-cache"`), so they must be same-origin or CORS-fetchable. Tiles are shuffled and assigned round-robin to gradients whenever the set changes. Reference implementation: `apps/docs/src/terrainAssets.ts` (Vite `import.meta.glob` over bundled PNGs). With no assets in `terrainHeight` mode, previews fall back to plain gradient ramps.

## Sharp edges

- Default store state has `previewMode: "terrainHeight"` — without `terrainAssets` you still get gradient-looking tiles (the fallback), but the mode toggle appears to do nothing.
- `SelectionGrid`'s `addTile.createItem` items are appended to *internal* state (`autoAppend`, default on) — they will not appear in your own `folders` prop data; use `onAddItems` to own them (set `autoAppend: false`). Object URLs created for added files are revoked on unmount when `revokeObjectUrls ?? autoAppend` is true — if you keep items yourself with `autoAppend: false`, URLs survive by default.
- Image tiles that fail to load render as flat `colorA` fills (worker posts `{ error }`, cached as status `"error"`, never retried while the tile's cache key stays active — atlas-signature changes only evict keys that dropped out of the set, so a retry needs the key itself to change: new `src`, or a cell-size/DPR change).
