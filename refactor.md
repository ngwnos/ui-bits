# Refactor Plan: ui-bits Library + Demo Workspace

This plan keeps the repo intact and refactors in-place. The goal is a workspace split where the demo consumes the library like a real user, followed by a SelectionGrid refactor and a clear terrain asset strategy.

## Phase 0: Baseline and Guardrails

1. Confirm the current demo and library builds run:
   - `bun run dev`
   - `bun run build`
2. Snapshot current behavior and UI with a short video or screenshots.
3. Record current public API surface and styles:
   - Library entry: `src/library.ts`
   - Exported CSS: `ui-bits/style.css`
   - Demo entry: `src/main.tsx`, `src/App.tsx`

Deliverable: a short note of what works and what breaks today (to compare later).

## Phase 1: Workspace Split (Monorepo in-place)

### 1.1 New structure

Create:
```
packages/
  ui-bits/
    src/
    package.json
    tsconfig.json
    tsconfig.lib.json
    vite.lib.config.ts
apps/
  demo/
    src/
    public/
    package.json
    tsconfig.json
    vite.config.ts
```

### 1.2 Root package.json (workspace)

Update the root `package.json`:
- Add `workspaces: ["packages/*", "apps/*"]`.
- Keep repo-level scripts as conveniences:
  - `dev`: run `apps/demo`
  - `build`: run `packages/ui-bits` (library build)
  - `build:demo`: run `apps/demo` build
  - `lint`: run both (or per-workspace)

### 1.3 Library package setup

Move library code to `packages/ui-bits/src` using `git mv` to keep history:
- `src/components/**` -> `packages/ui-bits/src/components/**`
  - Keep only library components; demo-only components should move to the demo app later.
- `src/lfo.ts`, `src/frameLoop/**`, `src/useStoreMirror.ts`, `src/utils/**` -> `packages/ui-bits/src/**`
- `src/library.ts` -> `packages/ui-bits/src/library.ts`
- `src/index.css` -> `packages/ui-bits/src/index.css` (or rename to `library.css`)

Create `packages/ui-bits/package.json`:
- `name: "ui-bits"`
- `main/module/types/style/exports` similar to current, but output names should match library name (not `lfoslider`).
- Declare React and other runtime deps as `peerDependencies`.
- Keep `dependencies` minimal (only true runtime dependencies).

Move `vite.lib.config.ts` and `tsconfig.lib.json` into `packages/ui-bits/` and update paths.

### 1.4 Demo app setup

Move demo to `apps/demo`:
- `src/App.tsx`, `src/main.tsx`, demo-specific CSS -> `apps/demo/src/**`
- `public/**` -> `apps/demo/public/**` (includes fonts and terrain assets)
- `index.html` -> `apps/demo/index.html`
- `vite.config.ts` -> `apps/demo/vite.config.ts`

In `apps/demo/package.json`, add dependency on the workspace package:
```
"dependencies": {
  "ui-bits": "workspace:*"
}
```
Update demo imports to come from `ui-bits` instead of relative paths.

### 1.5 CSS ownership

Decide which CSS is library-owned vs demo-owned:
- Library CSS should live in `packages/ui-bits/src` and be exported as `ui-bits/style.css`.
- Demo-only CSS should live in `apps/demo/src`.

For now:
- Move component CSS into `packages/ui-bits/src/components/**`.
- Keep demo layout and app-level styles in `apps/demo/src`.

### 1.6 Build outputs

Ensure library build outputs:
- JS bundles in `packages/ui-bits/dist`
- Types in `packages/ui-bits/dist/types`
- CSS in `packages/ui-bits/dist/ui-bits.css`

Ensure demo build outputs in `apps/demo/dist` (or `dist-demo` if desired).

Deliverable: workspace split with demo consuming `ui-bits` via workspace dependency; `bun run dev` works from root.

## Phase 2: SelectionGrid Refactor (clarify layers)

### 2.1 Goals

Split the current SelectionGrid into three layers:
1. Base selection grid behavior.
2. Gradient-specific selection grid.
3. Terrain preview add-on for gradients.

### 2.2 Proposed API

1. `SelectionGrid` (base):
   - Props for items, selection state, alignment, keyboard/pointer behavior.
   - Rendering hooks: `renderCell`, `renderOverlay`, or `getCellStyle`.
   - No assumptions about gradients or terrain.

2. `GradientSelectionGrid`:
   - Wraps `SelectionGrid`.
   - Owns gradient list, invert toggles, palette handling.
   - Exposes gradient-specific props.

3. `GradientTerrainPreview` (optional add-on):
   - Adds terrain preview mode controls.
   - Owns GPU/TypeGPU rendering or falls back to static images.
   - Loaded only when enabled (avoid heavy dependencies in base).

### 2.3 Code moves

In `packages/ui-bits/src/components/SelectionGrid`:
- Extract base grid logic into `SelectionGridBase.tsx`.
- Create `GradientSelectionGrid.tsx`.
- Create `GradientTerrainPreview.tsx` (or `useTerrainPreview.ts`).
- Update `index.ts` to export all three explicitly.

### 2.4 Store separation

Move demo-only store (`sliderStore/*`) to `apps/demo/src/` unless it is genuinely part of the library API.
The base SelectionGrid should not rely on the demo store.

### 2.5 Types and docs

Add short README docs for:
- Base SelectionGrid usage.
- Gradient selection usage.
- Terrain preview configuration.

Deliverable: clearly separated components and public docs describing each layer.

## Phase 3: Terrain Asset Strategy

### 3.1 Goals

Allow terrain previews without hard-coding `public/terrain` paths in the library.

### 3.2 Options

Option A (recommended): `assetBaseUrl` or loader callback:
- Base URL is provided by the host app (demo uses its own).
- Provide a small default fallback in the library (low-res sample).

Option B: package ships all terrain assets:
- Easy for users but heavy. Increases install size and package complexity.

### 3.3 Implementation sketch

- Add `terrainAssets?: { manifestUrl?: string; baseUrl?: string; loadTiles?: () => Promise<...> }` to terrain preview props.
- Demo supplies `baseUrl` from its own deployment.
- For npm publish later, consider a separate optional package for terrain assets.

Deliverable: no direct `fetch('/terrain/...')` inside library; all asset access is configurable.

## Phase 4: Package Hygiene for npm (later)

1. Convert runtime deps to `peerDependencies`:
   - `react`, `react-dom`, `@radix-ui/*`, `lucide-react`, `typegpu`
2. Publishable artifact integrity:
   - Add `files` and `exports` aligned to actual outputs.
   - Add `types` paths consistent with `dist/types`.
3. Remove or move demo-only fonts and assets out of library.
4. Update README to match the new structure.

Deliverable: npm-ready package, even if not published yet.

## Phase 5: Verification and Regression Checks

1. Manual checks:
   - Demo runs locally and in deployed environment.
   - Library can be imported by the demo with proper styling.
   - SelectionGrid works in all modes.
2. Lint and type checks:
   - `bun run lint` in both workspaces.
   - `bun run build` for library.
3. Basic usage sample in `apps/demo` to prove the new API.

---

If you want, we can execute this in small commits:
1) Workspace split, 2) SelectionGrid refactor, 3) Terrain assets.
