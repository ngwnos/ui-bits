# CLAUDE.md

React control library for graphics/audio tools. Core idea: **two-way coupling** — the same parameter can be driven by the UI, an LFO, audio analysis, or external code (API / voice assistant), and the control always animates to reflect the true current value regardless of who is driving.

## Docs (read before nontrivial changes)

- `docs/ARCHITECTURE.md` — module map, providers, frame/render model
- `docs/STATE-CONTRACT.md` — the state contract: state modes, control ids, LFO store semantics
- `docs/CONVENTIONS.md` — code conventions, dev warnings, testing patterns
- `docs/INTEGRATION_PATTERNS.md` — consumer integration recipes

## Hard invariants

- **Exactly one public state system: `controlStore`** (`src/controlStore`). Never introduce a new store or a parallel state system. `sliderStore` is legacy and selection-grid-only; `audioAnalysis` holds only FFT bin data. Neither is a general parameter store.
- **Respect the state contract** (`docs/STATE-CONTRACT.md`). Each control uses exactly one state mode: controlled (`value`), store-bound (`controlId`), or uncontrolled (`defaultValue`). `value` + `controlId` together is a dev-warned error and the store binding is ignored. While an LFO drives a store-bound `LFOSlider`, the base store key is deliberately `undefined` — do not "fix" this; frame-time readback goes through `onAnimatedUpdate` / `useStoreMirror`.
- **`packages/ui-bits/dist` is committed.** Any library source change must be followed by `bun --cwd packages/ui-bits build`, and the resulting dist committed alongside the source.
- **Before committing:** `bun test`, `bun run lint`, and `bun run check:exports` must all pass.
- **Branches:** develop on `dev` (or a feature branch). `main` is production-like — merge/push to `main` only with explicit user approval.

## Layout

- `packages/ui-bits` — the library (`src/`, `tests/`, committed `dist/`)
- `apps/docs` — docs/demo app (`bun run dev`)
- `scripts/verify-exports.mjs` — backs `bun run check:exports`
