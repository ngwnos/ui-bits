# AudioControls

Audio playback/analysis panel: transport + FFT display + analysis parameter sliders. Runs a Web Audio `AnalyserNode` (`fftSize` fixed at 2048 → 1024 raw bins) every frame, processes bins on the CPU (`binProcessing.ts`: attack/release envelope → optional gaussian blur → frequency-range resample to `binCount` bins), and publishes the result to an audio-analysis store that other components (e.g. `LFOSlider` in audio mode) sample from.

## Source union

```ts
type AudioControlsSource =
  | { type: "buffer"; src: string; loop?: boolean }                    // fetched + decoded; loop defaults true
  | { type: "mediaStream"; stream: MediaStream; context?: AudioContext } // context optional; created (and owned/closed) internally if omitted
  | { type: "audioNode"; node: AudioNode & { context: AudioContext } };  // node's own context is used, never closed
```

`buffer` gets a scrubbable playhead in the FFT window; live sources do not. `defaultMuted` is `true` — analysis runs silently until unmuted (output passes through a gain node, so muting does not stop analysis).

## Required providers

- **`FrameLoopProvider` is mandatory.** Both engines pull analyser data inside `useFrame`, and `useFrame` is a silent no-op when no `FrameLoopProvider` is above it — no error, no analysis, blank FFT window (no raw frames ever reach it).
- **`AudioAnalysisProvider` is optional.** The store that receives bins resolves as: `audioAnalysisStore` prop → context store from `AudioAnalysisProvider` → a private per-instance store. Without a provider (or explicit store prop), analysis is invisible to other components. Consumers read via `useAudioAnalysisState()` (returns `null` outside a provider) or a store's `getSnapshot()/subscribe()`.

## Control-store ids

`controlIdPrefix` (or, under `ControlIdProvider autoIds`, a slug of `ariaLabel` joined to the provider prefix — default label `"Audio controls"` → `audio-controls`) yields prefix-derived ids for exactly these parameters:

| id | parameter | range |
|---|---|---|
| `<prefix>.binCount` | output bin count | 1–1024, int |
| `<prefix>.binInterpolation` | `"discrete" \| "interpolated"` | — |
| `<prefix>.frequencyMin` / `<prefix>.frequencyMax` | analysis band, Hz | 0–Nyquist, min gap 10 Hz |
| `<prefix>.fftAttack` / `<prefix>.fftRelease` | envelope, ms | 0–500, 10 ms steps |
| `<prefix>.fftBlurSigma` | gaussian blur σ | 0–3, 0.1 steps |
| `<prefix>.analyserSmoothing` | analyser `smoothingTimeConstant` | 0–1, 0.1 steps |

**`playing` and `muted` are deliberately excluded** from prefix derivation — they bind to the control store only if given explicit ids via the `controlIds` prop (`controlIds={{ playing: "...", muted: "..." }}`). `controlIds.<key>` overrides the prefix-derived id for any key. Store binding is skipped for any parameter passed as a controlled prop (controlled prop > store > internal state, per `useControllableState`).

## Audio-reactive slider recipe

Verified against `apps/docs/src/App.tsx`. `LFOSlider` with `defaultWaveform="audio"` samples the shared analysis store each frame (prop override order inside the slider: `audioBins`/`audioBinCount`/`audioMaxMagnitude` props → context store):

```tsx
import { AudioAnalysisProvider, AudioControls, FrameLoopProvider, LFOSlider } from "ui-bits";

<FrameLoopProvider>
  <AudioAnalysisProvider>
    <AudioControls source={{ type: "buffer", src: "/audio/track.mp3" }} />
    <LFOSlider
      label="Audio LFO"
      min={0} max={100} step={1} defaultValue={50}
      width="100%"
      showLfoControls
      defaultLfoRunning
      defaultWaveform="audio"
    />
  </AudioAnalysisProvider>
</FrameLoopProvider>
```

In audio mode the slider's drawer "Freq" slider becomes a sample-position picker (which bin to read) and "Phase" becomes response; the slider's LFO frequency is preserved untouched while in audio mode. To feed a specific `AudioControls` instance to specific sliders without a provider, create a store with `createAudioAnalysisStore(...)`, pass it as `audioAnalysisStore` to `AudioControls`, and pass its snapshot values to the sliders' `audioBins`/`audioBinCount`/`audioMaxMagnitude` props.

## Paused behavior

When `playing` is false, both engines' frame callbacks early-return before touching the analyser: no `getByteFrequencyData`, no bin processing, no store writes, no raw-FFT frames. On the transition to paused, the analysis store is zero-filled **once** (bins set to zeros at the last bin count) rather than decaying. Consequences:

- Paused playback burns no per-frame CPU (this was recently fixed for the buffer engine; the live engine already gated).
- The raw-FFT buffer is zero-filled once on pause alongside the store, so the FFT window's envelope decays to silence and both data paths agree while paused.
- Buffer pause retains the playhead position; live sources disconnect the node chain entirely.

`suspended` (or an enclosing `AnimationSuspensionProvider`) unsubscribes the frame callbacks completely — not even the one-time zero-fill runs.

## AudioFFTWindow is a diverging GPU path

`AudioFFTWindow` (exported separately) renders raw analyser bytes with WebGPU via `typegpu`; without WebGPU support it renders a "WebGPU not available" placeholder — the CPU analysis path is unaffected. It reimplements the attack/release/blur/frequency-range chain in a compute shader and **can diverge slightly from the CPU path that feeds parameters**: its gaussian radius is capped at 12 taps, it runs the chain in a different order (resample first, blur around the resampled raw positions, envelope last on the target bins — vs. the CPU's envelope → blur → resample on the raw bins), and its peak-hold/decay markers are visual-only. Treat the window as a monitor; the numbers driving sliders come exclusively from `processBinsFromBytes` on the CPU.

Data flows into the window through refs polled by its internal rAF loop — `rawFftDataRef` + `rawFftMetaRef` (`{ version, binCount }`, takes precedence over the legacy `rawFrameVersion`/`rawBinCount` value props) and `playbackRatioRef` (takes precedence over `playbackRatio`). `AudioControls` uses the ref props so raw FFT frames and playhead motion cause zero React re-renders; the value props remain for standalone consumers.

## Optional peer dependencies

AudioControls itself needs no optional peers, but they can still break your build via the package root:

**Optional audio dependencies (`tone`, `soundfont-player`).** VirtualKeyboard loads its audio engines on demand via bare dynamic imports (`import("tone")`, `import("soundfont-player")`). Bundlers resolve dynamic imports at build time, so if these optional peers are not installed your build fails — Vite with `Rollup failed to resolve import "tone"`, webpack with `Module not found: Can't resolve 'tone'`. This happens even if you never render VirtualKeyboard, because the package's root entry statically includes the VirtualKeyboard chunk (subpath imports like `ui-bits/components/BasicButton` are unaffected). If you use keyboard audio, install both peers (`bun add tone soundfont-player`); they are code-split into async chunks and never fetched until keyboard audio is actually engaged — via the `tone`/`soundfont` props, or via an instrument selection backed by a tone/soundfont config (`instrumentOptions`/`soundfontConfig`/`toneConfig`). If you don't use keyboard audio, alias both specifiers to an empty local stub — Vite: `resolve: { alias: { tone: "./src/stubs/empty.ts", "soundfont-player": "./src/stubs/empty.ts" } }` (covers dev and build); webpack: `resolve: { alias: { tone: false, "soundfont-player": false } }`. With a stub in place, leave the `tone` and `soundfont` props unset and don't wire instrument options to tone/soundfont configs — then the dynamic imports never run at all. A load that genuinely fails is caught and reported through the component's audio-dependency error handling rather than crashing, but a stub that loads *successfully* bypasses that catch and would break at first use, so keep keyboard audio disabled; playback will not work either way.
