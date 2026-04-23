# ui-bits docs app

This app is the primary docs surface for `ui-bits` components.

## Run

From repo root:

```sh
bun run dev
```

Then open the Vite URL shown in terminal.

## Build and preview

```sh
bun run build
bun run preview
```

## Purpose

- Verify component behavior before publishing.
- Reproduce integration bugs with isolated docs sections.
- Validate control-store + preset interactions with realistic UI wiring.

## Editing guidance

- Keep examples focused and minimal.
- Prefer demonstrating one contract per section (controlled, store-bound, presets, etc.).
- If a behavior is subtle, add a short on-page note beside the example.
