import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BasicButton,
  AudioAnalysisProvider,
  createAudioAnalysisStore,
  AudioControls,
  Dropdown,
  IconDropdown,
  FloatingPanel,
  Folder,
  FrameLoopProvider,
  IconButton,
  LFOSlider,
  LoadingBar,
  PresetManager,
  PresetStoreProvider,
  SliderStoreProvider,
  SelectionGrid,
  SegmentBar,
  VirtualKeyboard,
  WebGpuStatus,
  type VirtualKeyboardInstrumentOption,
  type VirtualKeyboardSoundfontConfig,
  type VirtualKeyboardSoundfontOption,
  type VirtualKeyboardTone,
  useFrame,
  flexoki,
  sliderColorCombos,
} from 'ui-bits'
import {
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  MoonStar,
  Paintbrush,
  Power,
  PowerOff,
  Square,
  SquareCheckBig,
  Sun,
} from 'lucide-react'
import CodeBlock from './components/CodeBlock'
import DocsBrandCanvas, { type DocsBrandCanvasProps } from './components/DocsBrandCanvas'
import './App.css'

const ROUTES = [
  {
    id: 'slider',
    label: 'LFO Slider',
    title: 'LFO Slider',
    code: `<LFOSlider
  label="Example Slider"
  min={0}
  max={100}
  step={1}
  defaultValue={50}
  colorA={flexoki.orange["500"]}
  colorB={flexoki.orange["100"]}
  showLfoControls
  drawerOpen
/>`,
  },
  { id: 'icon-button', label: 'Icon Button', title: 'Icon Button', code: '' },
  { id: 'loading-bar', label: 'Loading Bar', title: 'Loading Bar', code: '' },
  {
    id: 'audio-controls',
    label: 'Audio Controls',
    title: 'Audio Controls',
    code: `<AudioControls
  source={{ type: "buffer", src: "/audio/credits.mp3" }}
  colorA={flexoki.red["600"]}
  colorB={flexoki.red["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
  },
  {
    id: 'segment-bar',
    label: 'Segment Bar',
    title: 'Segment Bar',
    code: `<SegmentBar
  options={[
    { value: "low", label: "Low" },
    { value: "mid", label: "Mid" },
    { value: "high", label: "High" },
  ]}
  defaultValue="mid"
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
  },
  {
    id: 'selection-grid',
    label: 'Selection Grid',
    title: 'Selection Grid',
    code: `<SelectionGrid
  previewDarkMode
  layoutGap="6px"
  colorA={flexoki.base["50"]}
  colorB={flexoki.base["100"]}
/>`,
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    title: 'Dropdown',
    code: `<Dropdown
  label="Waveform"
  options={[
    { value: "sine", label: "Sine" },
    { value: "triangle", label: "Triangle" },
    { value: "square", label: "Square", disabled: true },
  ]}
  value="sine"
  onChange={(value) => setWaveformValue(value)}
  colorA={flexoki.blue["600"]}
  colorB={flexoki.blue["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
  },
  {
    id: 'floating-panel',
    label: 'Floating Panel',
    title: 'Floating Panel',
    code: `const InspectorContent = () => {
  const panelTheme = usePanelTheme()
  // panelTheme exposes inherited colorA, colorB, fontSize, and borderStyle.

  return (
    <>
      <PresetManager maxListHeight={120} />
      <Folder
        label="WebGPU Status"
        colorA={flexoki.green["500"]}
        colorB={flexoki.green["100"]}
      >
        <WebGpuStatus />
      </Folder>
      <AudioControls source={{ type: "buffer", src: "/audio/credits.mp3" }} />
      <VirtualKeyboard
        defaultStartNote="C4"
        defaultNoteCount={26}
        defaultHeightUnits={2}
        showHeightControl={false}
        dialIndicatorColor={flexoki.red["600"]}
        instrumentOptions={[
          { value: "tonejs", label: "Tone.js", source: "tone" },
        ]}
        soundfontOptions={[
          { value: "acoustic_grand_piano", label: "Grand Piano" },
          { value: "electric_piano_1", label: "Electric Piano" },
        ]}
        defaultInstrument="acoustic_grand_piano"
        whiteKeyColor={flexoki.paper}
        blackKeyColor={flexoki.black}
      />
      <LFOSlider
        label="Gain"
        min={0}
        max={1}
        step={0.01}
        defaultValue={0.65}
        width="100%"
      />
      <LFOSlider
        label="Mix"
        min={0}
        max={100}
        step={1}
        defaultValue={40}
        width="100%"
      />
    </>
  )
}

<PresetStoreProvider storageKey="ui-bits:docs:floating-panel">
  <FloatingPanel
    title="Inspector"
    collapsible
    colorA={flexoki.blue["500"]}
    colorB={flexoki.blue["100"]}
    borderStyle="a"
    fontSize={12}
    width={300}
    verticalGap={6}
    paddingLeft={3}
    paddingRight={3}
    paddingBottom={3}
  >
    <InspectorContent />
  </FloatingPanel>
</PresetStoreProvider>`,
  },
]

const SIDEBAR_COLORS = [
  { colorA: flexoki.red['100'], colorB: flexoki.red['600'] },
  { colorA: flexoki.orange['100'], colorB: flexoki.orange['600'] },
  { colorA: flexoki.yellow['100'], colorB: flexoki.yellow['600'] },
  { colorA: flexoki.green['100'], colorB: flexoki.green['600'] },
  { colorA: flexoki.blue['100'], colorB: flexoki.blue['600'] },
  { colorA: flexoki.purple['100'], colorB: flexoki.purple['600'] },
]


const AUDIO_BIN_COUNT = 128

const fallbackCombo = { colorA: flexoki.orange['600'], colorB: flexoki.orange['150'] }

const buildRandomCombos = (
  source: typeof sliderColorCombos,
  count: number,
  fallback = fallbackCombo,
) => {
  if (source.length === 0) {
    return Array.from({ length: count }, () => fallback)
  }
  const combos = [...source]
  for (let i = combos.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = combos[i]
    combos[i] = combos[j]
    combos[j] = temp
  }
  return Array.from({ length: count }, (_, index) => combos[index] ?? fallback)
}

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

const AudioBinsDriver = ({ onFrame }: { onFrame: (nowSec: number, dtSec: number) => void }) => {
  useFrame(onFrame)
  return null
}

const SelectionGridDemo = () => {
  return (
    <>
      <SelectionGrid
        previewDarkMode
        layoutGap="6px"
        colorA={flexoki.base['50']}
        colorB={flexoki.base['100']}
        maxHeightUnits={20}
      />
    </>
  )
}

const getRouteFromHash = () => {
  if (typeof window === 'undefined') return ROUTES[0]
  const hash = window.location.hash.replace('#', '').replace('/', '')
  return ROUTES.find((route) => route.id === hash) ?? ROUTES[0]
}

function App() {
  const [activeRouteId, setActiveRouteId] = useState(() => getRouteFromHash().id)
  const [brandDivisions, setBrandDivisions] = useState(20)
  const [brandTextWidth, setBrandTextWidth] = useState(1.6)
  const [brandTextSpacing, setBrandTextSpacing] = useState(0.5)
  const [brandTextGain, setBrandTextGain] = useState(7.5)
  const [brandTextBlur, setBrandTextBlur] = useState(100)
  const [brandSpawnProbability, setBrandSpawnProbability] = useState(0.75)
  const [brandTickMs, setBrandTickMs] = useState(200)
  const [brandColorCycleMs, setBrandColorCycleMs] = useState(800)
  const [brandColorAttack, setBrandColorAttack] = useState(15)
  const [brandColorRelease, setBrandColorRelease] = useState(5)
  const [loadingBarValue, setLoadingBarValue] = useState(0.6)
  const [iconToggled, setIconToggled] = useState(false)
  const [powerToggled, setPowerToggled] = useState(false)
  const [weatherMode, setWeatherMode] = useState('drizzle')
  const [themeMode, setThemeMode] = useState('dark')
  const audioBinsRef = useRef<number[]>(Array.from({ length: AUDIO_BIN_COUNT }, () => 0))
  const [iconSizeColors, setIconSizeColors] = useState(() => (
    buildRandomCombos(sliderColorCombos, 4)
  ))
  const [exampleDrawerOpen, setExampleDrawerOpen] = useState(true)
  const [discreteDrawerOpen, setDiscreteDrawerOpen] = useState(false)
  const [continuousDrawerOpen, setContinuousDrawerOpen] = useState(false)
  const [stepAlignedDrawerOpen, setStepAlignedDrawerOpen] = useState(false)
  const [sineDrawerOpen, setSineDrawerOpen] = useState(false)
  const [triangleDrawerOpen, setTriangleDrawerOpen] = useState(false)
  const [sawDrawerOpen, setSawDrawerOpen] = useState(false)
  const [squareDrawerOpen, setSquareDrawerOpen] = useState(false)
  const [audioDrawerOpen, setAudioDrawerOpen] = useState(false)
  const randomizedSliderColors = useMemo(() => {
    const fallback = fallbackCombo
    const source = sliderColorCombos
    if (source.length === 0) {
      return {
        discrete: fallback,
        stepAligned: fallback,
        continuous: fallback,
        sine: fallback,
        triangle: fallback,
        saw: fallback,
        square: fallback,
        audio: fallback,
        font10: fallback,
        font12: fallback,
        font14: fallback,
        font16: fallback,
      }
    }
    const shuffle = () => {
      const combos = [...source]
      for (let i = combos.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = combos[i]
        combos[i] = combos[j]
        combos[j] = temp
      }
      return combos
    }
    let deck = shuffle()
    let index = 0
    const next = () => {
      if (index >= deck.length) {
        deck = shuffle()
        index = 0
      }
      return deck[index++] ?? fallback
    }
    return {
      discrete: next(),
      stepAligned: next(),
      continuous: next(),
      sine: next(),
      triangle: next(),
      saw: next(),
      square: next(),
      audio: next(),
      font10: next(),
      font12: next(),
      font14: next(),
      font16: next(),
    }
  }, [])
  const brandPalette = useMemo(
    () => [
      flexoki.red['500'],
      flexoki.orange['500'],
      flexoki.yellow['500'],
      flexoki.green['500'],
      flexoki.blue['500'],
      flexoki.purple['500'],
    ],
    [],
  )
  const brandBackground = 'rgb(16, 15, 15)'
  const brandTextColor = flexoki.base['50']
  const weatherOptions = useMemo(() => ([
    {
      value: 'drizzle',
      icon: <CloudDrizzle />,
      colorA: flexoki.blue['600'],
      colorB: flexoki.blue['150'],
      ariaLabel: 'Drizzle',
    },
    {
      value: 'lightning',
      icon: <CloudLightning />,
      colorA: flexoki.yellow['600'],
      colorB: flexoki.yellow['150'],
      ariaLabel: 'Lightning',
    },
    {
      value: 'snow',
      icon: <CloudSnow />,
      colorA: flexoki.base['800'],
      colorB: flexoki.base['150'],
      ariaLabel: 'Snow',
    },
    {
      value: 'sun',
      icon: <Sun />,
      colorA: flexoki.orange['600'],
      colorB: flexoki.orange['150'],
      ariaLabel: 'Sun',
    },
  ]), [])
  const segmentOptions = useMemo(() => ([
    { value: 'low', label: 'Low' },
    { value: 'mid', label: 'Mid' },
    { value: 'high', label: 'High' },
  ]), [])
  const dropdownOptions = useMemo(() => ([
    { value: 'sine', label: 'Sine' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'square', label: 'Square', disabled: true },
  ]), [])
  const iconDropdownOptions = useMemo(() => ([
    { value: 'drizzle', label: 'Drizzle', icon: <CloudDrizzle /> },
    { value: 'lightning', label: 'Lightning', icon: <CloudLightning /> },
    { value: 'snow', label: 'Snow', icon: <CloudSnow /> },
    { value: 'sun', label: 'Sun', icon: <Sun /> },
  ]), [])
  const [waveformValue, setWaveformValue] = useState('sine')
  const [iconDropdownValue, setIconDropdownValue] = useState('drizzle')
  const themeOptions = useMemo(() => ([
    {
      value: 'dark',
      icon: <MoonStar />,
      colorA: flexoki.purple['600'],
      colorB: flexoki.purple['150'],
      ariaLabel: 'Dark mode',
    },
    {
      value: 'light',
      icon: <Sun />,
      colorA: flexoki.yellow['600'],
      colorB: flexoki.yellow['150'],
      ariaLabel: 'Light mode',
    },
  ]), [])
  const activeRoute = useMemo(
    () => ROUTES.find((route) => route.id === activeRouteId) ?? ROUTES[0],
    [activeRouteId],
  )
  const brandCanvasProps = useMemo<DocsBrandCanvasProps>(() => ({
    divisions: brandDivisions,
    palette: brandPalette,
    backgroundColor: brandBackground,
    textColor: brandTextColor,
    textBlur: brandTextBlur,
    textGain: brandTextGain,
    textWidth: brandTextWidth,
    textSpacing: brandTextSpacing,
    spawnProbability: brandSpawnProbability,
    tickMs: brandTickMs,
    colorAttack: brandColorAttack,
    colorRelease: brandColorRelease,
    colorCycleMs: brandColorCycleMs,
  }), [
    brandDivisions,
    brandPalette,
    brandBackground,
    brandTextColor,
    brandTextBlur,
    brandTextGain,
    brandTextWidth,
    brandTextSpacing,
    brandSpawnProbability,
    brandTickMs,
    brandColorAttack,
    brandColorRelease,
    brandColorCycleMs,
  ])

  const updateAudioBins = useCallback((nowSec: number, _dtSec: number) => {
    const bins = audioBinsRef.current
    const t = nowSec
    const phaseA = t * 4.5
    const phaseB = t * 8
    const phaseC = t * 14
    const drift = t * 2
    const count = bins.length
    if (!count) return
    const span = count - 1
    for (let i = 0; i < count; i += 1) {
      const ratio = span > 0 ? i / span : 0
      const x = ratio * Math.PI * 2
      const waveA = Math.sin(x * 1.1 + phaseA)
      const waveB = Math.sin(x * 2.7 + phaseB + Math.sin(drift) * 0.6)
      const waveC = Math.sin(x * 4.5 - phaseC + ratio * 1.4)
      const envelope = 0.6 + 0.4 * Math.sin(x * 0.35 - drift)
      const value = 0.5 + (0.28 * waveA + 0.18 * waveB + 0.12 * waveC) * envelope
      bins[i] = clampUnit(value)
    }
  }, [])

  const liveAnalysisStore = useMemo(() => createAudioAnalysisStore({
    bins: [],
    binCount: 0,
    maxMagnitude: 1,
  }), [])
  const [liveSource, setLiveSource] = useState<null | { type: "audioNode"; node: AudioNode & { context: AudioContext } }>(null)
  const keyboardInstrumentOptions = useMemo<VirtualKeyboardInstrumentOption[]>(() => ([
    { value: 'tonejs', label: 'Tone.js', source: 'tone' },
  ]), [])
  const keyboardSoundfontOptions = useMemo<VirtualKeyboardSoundfontOption[]>(() => ([
    { value: 'acoustic_grand_piano', label: 'Grand Piano' },
    { value: 'electric_piano_1', label: 'Electric Piano' },
    { value: 'marimba', label: 'Marimba' },
    { value: 'vibraphone', label: 'Vibraphone' },
    { value: 'drawbar_organ', label: 'Drawbar Organ' },
    { value: 'synth_strings_1', label: 'Synth Strings' },
  ]), [])
  const keyboardSoundfontConfig = useMemo<VirtualKeyboardSoundfontConfig | null>(() => {
    if (!liveSource) return null
    return {
      soundfont: 'MusyngKite',
      format: 'mp3',
      destination: liveSource.node,
    }
  }, [liveSource])
  const keyboardToneConfig = useMemo<VirtualKeyboardTone | null>(() => {
    if (!liveSource) return null
    return {
      destination: liveSource.node,
      context: liveSource.node.context,
      polyphony: 32,
    }
  }, [liveSource])

  useEffect(() => {
    if (typeof AudioContext === 'undefined') return undefined
    const context = new AudioContext()
    const masterGain = context.createGain()
    masterGain.gain.value = 0.4
    setLiveSource({ type: "audioNode", node: masterGain as unknown as AudioNode & { context: AudioContext } })
    return () => {
      masterGain.disconnect()
      void context.close().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRouteId(getRouteFromHash().id)
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])



  const handleNavClick = (routeId: string) => {
    if (typeof window === 'undefined') return
    window.location.hash = routeId
    setActiveRouteId(routeId)
  }
  return (
    <FrameLoopProvider>
      <AudioAnalysisProvider>
        <AudioBinsDriver onFrame={updateAudioBins} />
        <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-brand">
            <DocsBrandCanvas {...brandCanvasProps} />
          </div>
          <Folder
            className="docs-folder"
            label="Components"
            colorA={flexoki.base['100']}
            colorB={flexoki.base['800']}
            borderStyle="none"
            transparent
            fontSize={16}
            padding={6}
            verticalGap={6}
          >
            {ROUTES.map((route, index) => {
              const palette = SIDEBAR_COLORS[index % SIDEBAR_COLORS.length]
              return (
                <BasicButton
                  key={route.id}
                  className="docs-button"
                  colorA={palette.colorA}
                  colorB={palette.colorB}
                  borderStyle="none"
                  fontSize={16}
                  onClick={() => handleNavClick(route.id)}
                >
                  {route.label}
                </BasicButton>
              )
            })}
          </Folder>
        </aside>
        <main className="docs-main">
          <h1 className="docs-title">{activeRoute.title}</h1>
          {activeRouteId === 'slider' ? (
            <>
              <div className="docs-code-section">
                <LFOSlider
                  label="Example Slider"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={50}
                  width="100%"
                  colorA={flexoki.orange["500"]}
                  colorB={flexoki.orange["100"]}
                  border="a"
                  fontSize={12}
                  showLfoControls
                  drawerOpen={exampleDrawerOpen}
                  onDrawerOpenChange={setExampleDrawerOpen}
                />
                <CodeBlock code={activeRoute.code} />
              </div>
              <h2 className="docs-section-title">Bar Style</h2>
              <div className="docs-slider-grid">
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Discrete"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.discrete.colorA}
                    colorB={randomizedSliderColors.discrete.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={discreteDrawerOpen}
                    onDrawerOpenChange={setDiscreteDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="discrete"
                    barSegmentCount={32}
                  />
                  <CodeBlock code={`barStyle="discrete"\nbarSegmentCount={32}`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Step-Aligned"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.stepAligned.colorA}
                    colorB={randomizedSliderColors.stepAligned.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={stepAlignedDrawerOpen}
                    onDrawerOpenChange={setStepAlignedDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="step-aligned"
                  />
                  <CodeBlock code={`barStyle="step-aligned"\n`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Continuous"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.continuous.colorA}
                    colorB={randomizedSliderColors.continuous.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={continuousDrawerOpen}
                    onDrawerOpenChange={setContinuousDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`barStyle="continuous"\n`} />
                </div>
              </div>
              <h2 className="docs-section-title">LFO Waveforms</h2>
              <div className="docs-slider-grid docs-slider-grid--five">
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Sine"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.sine.colorA}
                    colorB={randomizedSliderColors.sine.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRange={[20, 80]}
                    drawerOpen={sineDrawerOpen}
                    onDrawerOpenChange={setSineDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="sine"
                    defaultFrequency={0.2}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`defaultWaveform="sine"\ndefaultFrequency={0.2}\ndefaultLfoRange={[20, 80]}`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Triangle"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.triangle.colorA}
                    colorB={randomizedSliderColors.triangle.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRange={[20, 80]}
                    drawerOpen={triangleDrawerOpen}
                    onDrawerOpenChange={setTriangleDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.2}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`defaultWaveform="triangle"\ndefaultFrequency={0.2}\ndefaultLfoRange={[20, 80]}`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Sawtooth"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.saw.colorA}
                    colorB={randomizedSliderColors.saw.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRange={[20, 80]}
                    drawerOpen={sawDrawerOpen}
                    onDrawerOpenChange={setSawDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="saw"
                    defaultFrequency={0.4}
                    defaultPhase={0.5}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`defaultWaveform="saw"\ndefaultFrequency={0.4}\ndefaultPhase={0.5}\ndefaultLfoRange={[20, 80]}`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Square"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.square.colorA}
                    colorB={randomizedSliderColors.square.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRange={[20, 80]}
                    drawerOpen={squareDrawerOpen}
                    onDrawerOpenChange={setSquareDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="square"
                    defaultFrequency={0.4}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`defaultWaveform="square"\ndefaultFrequency={0.4}\ndefaultLfoRange={[20, 80]}`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Audio"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.audio.colorA}
                    colorB={randomizedSliderColors.audio.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRange={[20, 80]}
                    drawerOpen={audioDrawerOpen}
                    onDrawerOpenChange={setAudioDrawerOpen}
                    defaultLfoRunning
                    defaultWaveform="audio"
                    defaultFrequency={0.2}
                    barStyle="continuous"
                    audioBins={audioBinsRef.current}
                    audioBinCount={AUDIO_BIN_COUNT}
                    audioMaxMagnitude={1}
                  />
                  <CodeBlock code={`defaultWaveform="audio"\ndefaultFrequency={0.2}\ndefaultLfoRange={[20, 80]}`} />
                </div>
              </div>
              <h2 className="docs-section-title">Font Size</h2>
              <div className="docs-slider-grid docs-slider-grid--four">
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Font Size 10"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.font10.colorA}
                    colorB={randomizedSliderColors.font10.colorB}
                    border="a"
                    fontSize={10}
                    showLfoControls
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`fontSize={10}\n`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Font Size 12"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.font12.colorA}
                    colorB={randomizedSliderColors.font12.colorB}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`fontSize={12}\n`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Font Size 14"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.font14.colorA}
                    colorB={randomizedSliderColors.font14.colorB}
                    border="a"
                    fontSize={14}
                    showLfoControls
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`fontSize={14}\n`} />
                </div>
                <div className="docs-slider-item">
                  <LFOSlider
                    label="Font Size 16"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={randomizedSliderColors.font16.colorA}
                    colorB={randomizedSliderColors.font16.colorB}
                    border="a"
                    fontSize={16}
                    showLfoControls
                    defaultLfoRunning
                    defaultWaveform="triangle"
                    defaultFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`fontSize={16}\n`} />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  LFOSlider is designed to feel like an instrument: you can let it own its state with
                  <code>defaultValue</code> and other <code>default*</code> props, or control it with{" "}
                  <code>value</code> plus <code>onUserChange</code>/<code>onAnimatedUpdate</code> for
                  app-driven state.
                </p>
                <p>
                  LFO controls are opt-in via <code>showLfoControls</code>, and{" "}
                  <code>defaultWaveform</code>, <code>defaultFrequency</code>, and{" "}
                  <code>defaultLfoRange</code> give you expressive defaults without forcing control.
                  Keep <code>colorA</code> for text/lines and <code>colorB</code> for the fill so the
                  slider stacks cleanly with other controls.
                </p>
              </div>
            </>
          ) : activeRouteId === 'icon-button' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-icon-hero">
                  <IconButton
                    behavior="cycle"
                    options={themeOptions}
                    value={themeMode}
                    onChange={(value) => setThemeMode(value)}
                    fontSize={16}
                    borderStyle="a"
                  />
                </div>
                <CodeBlock
                  code={`<IconButton
  behavior="cycle"
  options={[
    { value: "dark", icon: <MoonStar /> },
    { value: "light", icon: <Sun /> },
  ]}
  value="dark"
  onChange={(value) => setThemeMode(value)}
/>`}
                />
              </div>
              <h2 className="docs-section-title">Behavior</h2>
              <div className="docs-icon-grid">
                <div className="docs-icon-item">
                  <IconButton
                    fontSize={16}
                    colorA={flexoki.orange['600']}
                    colorB={flexoki.orange['150']}
                    borderStyle="a"
                    aria-label="Paint"
                    onClick={() => setIconSizeColors(buildRandomCombos(sliderColorCombos, 4))}
                  >
                    <Paintbrush />
                  </IconButton>
                  <CodeBlock code={`behavior="momentary"`} />
                </div>
                <div className="docs-icon-item">
                  <div className="docs-icon-row">
                    <IconButton
                      behavior="toggle"
                      toggled={iconToggled}
                      onToggle={setIconToggled}
                      fontSize={16}
                      colorA={flexoki.green['600']}
                      colorB={flexoki.green['150']}
                      borderStyle="a"
                      aria-label="Checked"
                    >
                      {iconToggled ? <SquareCheckBig /> : <Square />}
                    </IconButton>
                    <IconButton
                      behavior="toggle"
                      toggled={powerToggled}
                      onToggle={setPowerToggled}
                      fontSize={16}
                      colorA={flexoki.red['600']}
                      colorB={flexoki.red['150']}
                      borderStyle="a"
                      aria-label="Power"
                    >
                      {powerToggled ? <Power /> : <PowerOff />}
                    </IconButton>
                  </div>
                  <CodeBlock code={`behavior="toggle"`} />
                </div>
                <div className="docs-icon-item">
                  <div className="docs-icon-row">
                    <IconButton
                      behavior="cycle"
                      options={weatherOptions}
                      value={weatherMode}
                      onChange={(value) => setWeatherMode(value)}
                      fontSize={16}
                      borderStyle="a"
                      colorA={flexoki.blue['600']}
                      colorB={flexoki.blue['150']}
                    />
                  </div>
                  <CodeBlock code={`behavior="cycle"`} />
                </div>
              </div>
              <h2 className="docs-section-title">Font Size</h2>
              <div className="docs-icon-grid docs-icon-grid--four">
                {[10, 12, 14, 16].map((size, index) => {
                  const colors = iconSizeColors[index] ?? fallbackCombo
                  return (
                    <div key={size} className="docs-icon-item">
                      <IconButton
                        fontSize={size}
                        colorA={colors.colorA}
                        colorB={colors.colorB}
                        borderStyle="a"
                        aria-label={`Paint size ${size}`}
                      >
                        <Paintbrush />
                      </IconButton>
                      <CodeBlock code={`fontSize={${size}}\n`} />
                    </div>
                  )
                })}
              </div>
              <div className="docs-text-block">
                <p>
                  IconButton matches slider sizing so it can live inside the same bars. Use{" "}
                  <code>behavior="momentary"</code> for press-and-hold,{" "}
                  <code>behavior="toggle"</code> for on/off, and{" "}
                  <code>behavior="cycle"</code> with <code>options</code> for multi-state controls.
                </p>
                <p>
                  For state, use <code>defaultToggled</code>/<code>defaultPressed</code> when the
                  button can manage itself, or switch to controlled props like{" "}
                  <code>toggled</code>/<code>pressed</code> with{" "}
                  <code>onToggle</code>/<code>onPressChange</code>. Use{" "}
                  <code>borderStyle</code> and <code>borderMask</code> to keep borders flush with
                  neighboring controls.
                </p>
              </div>
            </>
          ) : activeRouteId === 'loading-bar' ? (
            <>
              <div className="docs-code-section">
                <LoadingBar
                  value={loadingBarValue}
                  width="100%"
                  colorA={flexoki.green['600']}
                  colorB={flexoki.green['100']}
                  border="a"
                  fontSize={12}
                  barStyle="discrete"
                  barSegmentCount={24}
                />
                <LFOSlider
                  label="Value"
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={loadingBarValue}
                  value={loadingBarValue}
                  width="100%"
                  colorA={flexoki.green['600']}
                  colorB={flexoki.green['100']}
                  border="a"
                  fontSize={12}
                  onUserChange={setLoadingBarValue}
                  onAnimatedUpdate={setLoadingBarValue}
                  formatDisplayValue={(value) => value.toFixed(2)}
                />
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  LoadingBar is a display-only control: you drive <code>value</code> from your app,
                  an animation loop, or an LFO. It intentionally has no input handling so it stays
                  lightweight and predictable.
                </p>
                <p>
                  Use <code>barStyle</code> and <code>barSegmentCount</code> to mirror slider
                  visuals, and keep <code>colorA</code>/<code>colorB</code> consistent so it reads
                  like part of the same instrument rack.
                </p>
              </div>
            </>
          ) : activeRouteId === 'audio-controls' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-audio-stack">
                  <AudioControls
                    source={{ type: "buffer", src: "/audio/credits.mp3" }}
                    colorA={flexoki.red['600']}
                    colorB={flexoki.red['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <LFOSlider
                    label="Audio LFO"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={50}
                    width="100%"
                    colorA={flexoki.red['600']}
                    colorB={flexoki.red['100']}
                    border="a"
                    fontSize={12}
                    showLfoControls
                    defaultLfoRunning
                    defaultWaveform="audio"
                  />
                </div>
                <CodeBlock
                  code={`<AudioAnalysisProvider>
  <AudioControls
    source={{ type: "buffer", src: "/audio/credits.mp3" }}
    colorA={flexoki.red["600"]}
    colorB={flexoki.red["100"]}
    borderStyle="a"
    fontSize={12}
  />
  <LFOSlider
    label="Audio LFO"
    min={0}
    max={100}
    step={1}
    defaultValue={50}
    showLfoControls
    defaultLfoRunning
    defaultWaveform="audio"
  />
</AudioAnalysisProvider>`}
                />
              </div>
              <h3 className="docs-section-title">Live Input</h3>
              <div className="docs-code-section">
                <div className="docs-audio-stack">
                  {liveSource ? (
                    <AudioControls
                      source={liveSource}
                      audioAnalysisStore={liveAnalysisStore}
                      colorA={flexoki.red['600']}
                      colorB={flexoki.red['100']}
                      borderStyle="a"
                      fontSize={12}
                      defaultPlaying
                      defaultMuted={false}
                    />
                  ) : null}
                  <VirtualKeyboard
                    defaultStartNote={21}
                    defaultNoteCount={88}
                    defaultHeightUnits={3}
                    fontSize={12}
                    colorA={flexoki.red['100']}
                    colorB={flexoki.red['600']}
                    instrumentOptions={keyboardInstrumentOptions}
                    soundfontOptions={keyboardSoundfontOptions}
                    defaultInstrument="acoustic_grand_piano"
                    soundfontConfig={keyboardSoundfontConfig ?? undefined}
                    toneConfig={keyboardToneConfig ?? undefined}
                    whiteKeyColor={flexoki.paper}
                    blackKeyColor={flexoki.black}
                  />
                </div>
                <CodeBlock
                  code={`const keyboardOutput = masterGain

<AudioControls
  source={{ type: "audioNode", node: keyboardOutput }}
  audioAnalysisStore={analysisStore}
  colorA={flexoki.red["600"]}
  colorB={flexoki.red["100"]}
  borderStyle="a"
  fontSize={12}
/>
<VirtualKeyboard
  defaultStartNote={21}
  defaultNoteCount={88}
  defaultHeightUnits={3}
  instrumentOptions={[
    { value: "tonejs", label: "Tone.js", source: "tone" },
  ]}
  soundfontOptions={[
    { value: "acoustic_grand_piano", label: "Grand Piano" },
    { value: "electric_piano_1", label: "Electric Piano" },
  ]}
  defaultInstrument="acoustic_grand_piano"
  soundfontConfig={{
    soundfont: "MusyngKite",
    format: "mp3",
    destination: keyboardOutput,
  }}
  toneConfig={{
    destination: keyboardOutput,
    context: keyboardOutput.context,
    polyphony: 32,
  }}
  colorA={flexoki.red["100"]}
  colorB={flexoki.red["600"]}
  whiteKeyColor={flexoki.paper}
  blackKeyColor={flexoki.black}
/>`}
                />
              </div>
              <div className="docs-text-block">
                <p>
                  AudioControls can run standalone, but to share FFT data with sliders, wrap your
                  UI in <code>AudioAnalysisProvider</code> or pass an{" "}
                  <code>audioAnalysisStore</code> directly. Any slider using the{" "}
                  <code>"audio"</code> waveform will read from the same analysis stream.
                </p>
                <p>
                  Use <code>source</code> to choose buffer playback or live input (media stream or
                  audio node). Use <code>default*</code> props for initial UI behavior, or controlled
                  props like <code>playing</code>, <code>binCount</code>, and{" "}
                  <code>binInterpolation</code> if you need to synchronize with app state. Frequency
                  limits are in Hz, and the FFT controls are tuned for quick performance shaping.
                </p>
                <p>
                  VirtualKeyboard can play soundfonts by passing <code>soundfontOptions</code>{" "}
                  (for a dropdown) or a fixed <code>soundfont</code> prop. Provide a custom{" "}
                  <code>url</code> to host samples locally, or a destination node so the keyboard
                  and AudioControls share the same analysis stream.
                </p>
              </div>
            </>
          ) : activeRouteId === 'segment-bar' ? (
            <>
              <div className="docs-code-section">
                <SegmentBar
                  options={segmentOptions}
                  defaultValue="mid"
                  colorA={flexoki.purple['600']}
                  colorB={flexoki.purple['100']}
                  borderStyle="a"
                  fontSize={12}
                />
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  SegmentBar is a discrete selector: pass an array of{" "}
                  <code>{`{ value, label }`}</code> options and let it manage selection with{" "}
                  <code>defaultValue</code>, or control it with <code>value</code> and{" "}
                  <code>onChange</code>.
                </p>
                <p>
                  It supports keyboard navigation and keeps the same sizing rhythm as sliders. Use{" "}
                  <code>borderStyle</code>, <code>colorA</code>, and <code>colorB</code> so it blends
                  into stacked control rows.
                </p>
              </div>
            </>
          ) : activeRouteId === 'selection-grid' ? (
            <>
              <div className="docs-code-section">
                <SliderStoreProvider>
                  <div className="docs-selection-grid-stack">
                    <SelectionGridDemo />
                  </div>
                </SliderStoreProvider>
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  SelectionGrid is a rich palette selector with built-in gradient previews and
                  optional terrain rendering. It manages its own store unless you supply one via the
                  shared slider store context.
                </p>
                <p>
                  Keep the layout gap and colors aligned with your other controls so the grid feels
                  like part of the same instrument panel. Terrain previews are opt-in via the
                  built-in preview mode toggle.
                </p>
              </div>
            </>
          ) : activeRouteId === 'dropdown' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-dropdown-stack">
                  <Dropdown
                    label="Waveform"
                    options={dropdownOptions}
                    value={waveformValue}
                    onChange={(value) => setWaveformValue(value)}
                    colorA={flexoki.blue['600']}
                    colorB={flexoki.blue['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <IconDropdown
                    label="Weather"
                    options={iconDropdownOptions}
                    value={iconDropdownValue}
                    onChange={(value) => setIconDropdownValue(value)}
                    colorA={flexoki.cyan['600']}
                    colorB={flexoki.cyan['100']}
                    borderStyle="a"
                    fontSize={12}
                    width={200}
                    showMenuIcons
                  />
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<IconDropdown
  label="Weather"
  options={[
    { value: "drizzle", label: "Drizzle", icon: <CloudDrizzle /> },
    { value: "lightning", label: "Lightning", icon: <CloudLightning /> },
    { value: "snow", label: "Snow", icon: <CloudSnow /> },
    { value: "sun", label: "Sun", icon: <Sun /> },
  ]}
  value="drizzle"
  onChange={(value) => setIconDropdownValue(value)}
  colorA={flexoki.cyan["600"]}
  colorB={flexoki.cyan["100"]}
  borderStyle="a"
  fontSize={12}
  showMenuIcons
/>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  Dropdown favors compact, keyboard-friendly selection with a clear label and
                  explicit option list. Use <code>defaultValue</code> for uncontrolled menus or
                  <code>value</code> + <code>onChange</code> to bind it to application state.
                </p>
                <p>
                  IconDropdown reuses the same menu and keyboard behavior, but uses an icon trigger.
                  Give it a short label for accessibility and set a wider width so the menu text has
                  breathing room.
                </p>
              </div>
            </>
          ) : activeRouteId === 'floating-panel' ? (
            <>
              <div className="docs-code-section">
                <PresetStoreProvider storageKey="ui-bits:docs:floating-panel">
                  <FloatingPanel
                    title="Inspector"
                    collapsible
                    colorA={flexoki.blue['500']}
                    colorB={flexoki.blue['100']}
                    borderStyle="a"
                    fontSize={12}
                    width={300}
                    verticalGap={6}
                    paddingLeft={3}
                    paddingRight={3}
                    paddingBottom={3}
                  >
      <PresetManager maxListHeight={120} />
      <Folder
        label="WebGPU Status"
        colorA={flexoki.green["500"]}
        colorB={flexoki.green["100"]}
      >
        <WebGpuStatus />
      </Folder>
      <AudioControls source={{ type: "buffer", src: "/audio/credits.mp3" }} />
                    <VirtualKeyboard
                      defaultStartNote="C4"
                      defaultNoteCount={26}
                      defaultHeightUnits={2}
                      showHeightControl={false}
                      instrumentOptions={keyboardInstrumentOptions}
                      soundfontOptions={keyboardSoundfontOptions}
                      defaultInstrument="acoustic_grand_piano"
                      whiteKeyColor={flexoki.paper}
                      blackKeyColor={flexoki.black}
                    />
                    <LFOSlider
                      label="Gain"
                      min={0}
                      max={1}
                      step={0.01}
                      defaultValue={0.65}
                      width="100%"
                      showLfoControls
                    />
                    <LFOSlider
                      label="Mix"
                      min={0}
                      max={100}
                      step={1}
                      defaultValue={40}
                      width="100%"
                      showLfoControls
                    />
                    <Folder
                      label="Modulators"
                      borderStyle="none"
                      colorA={flexoki.red['500']}
                      colorB={flexoki.red['100']}
                    >
                      <LFOSlider
                        label="Drive"
                        min={0}
                        max={1}
                        step={0.01}
                        defaultValue={0.25}
                        width="100%"
                        showLfoControls
                      />
                      <LFOSlider
                        label="Tone"
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={55}
                        width="100%"
                        showLfoControls
                      />
                      <LFOSlider
                        label="Width"
                        min={0}
                        max={1}
                        step={0.01}
                        defaultValue={0.4}
                        width="100%"
                        showLfoControls
                      />
                    </Folder>
                    <LFOSlider
                      label="Output"
                      min={0}
                      max={1}
                      step={0.01}
                      defaultValue={0.8}
                      width="100%"
                      showLfoControls
                    />
                  </FloatingPanel>
                </PresetStoreProvider>
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  FloatingPanel provides a compact header + body container for stacked controls. Use{" "}
                  <code>collapsible</code> to add the toggle icon, and set <code>title</code> or{" "}
                  <code>header</code> when you need a custom top row.
                </p>
                <p>
                  Use <code>draggable</code> + <code>showDockButton</code> when you want a true floating
                  inspector. For dense stacks, <code>verticalGap</code> and the padding props control
                  the spacing between controls without affecting their borders.
                </p>
              </div>
            </>
          ) : (
            <CodeBlock code={activeRoute.code} />
          )}
        </main>
        <FloatingPanel
          className="docs-panel"
          title="Shader"
          collapsible
          showDockButton
          dockOnMount
          colorA="#F2F0E5"
          colorB="#282726"
          borderStyle="a"
          fontSize={12}
          width={240}
          draggable
          transparent
          bodyOpacity={0.85}
          bodyBlur={6}
          paddingLeft={0}
          paddingRight={0}
          defaultCollapsed
        >
        <LFOSlider
          label="Divisions"
          min={2}
          max={40}
          step={1}
            width="100%"
            colorA="#F2F0E5"
            colorB="#282726"
            border="a"
            fontSize={12}
            mode="auto"
            showLfoControls
            readExternal={() => brandDivisions}
            onUserChange={(value) => setBrandDivisions(Math.round(value))}
          onAnimatedUpdate={(value) => setBrandDivisions(Math.round(value))}
          formatDisplayValue={(value) => `${Math.round(value)}`}
        />
        <LFOSlider
          label="Text Size"
          min={0.4}
          max={1.6}
          step={0.01}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandTextWidth}
          onUserChange={setBrandTextWidth}
          onAnimatedUpdate={setBrandTextWidth}
          formatDisplayValue={(value) => value.toFixed(2)}
        />
        <LFOSlider
          label="Text Spacing"
          min={0}
          max={0.6}
          step={0.01}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandTextSpacing}
          onUserChange={setBrandTextSpacing}
          onAnimatedUpdate={setBrandTextSpacing}
          formatDisplayValue={(value) => value.toFixed(2)}
        />
        <LFOSlider
          label="Text Blur"
          min={0}
          max={100}
          step={0.5}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandTextBlur}
          onUserChange={setBrandTextBlur}
          onAnimatedUpdate={setBrandTextBlur}
          formatDisplayValue={(value) => value.toFixed(1)}
        />
        <LFOSlider
          label="Text Gain"
          min={0.5}
          max={10}
          step={0.1}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandTextGain}
          onUserChange={setBrandTextGain}
          onAnimatedUpdate={setBrandTextGain}
          formatDisplayValue={(value) => value.toFixed(1)}
        />
        <LFOSlider
          label="Spawn Chance"
          min={0}
          max={1}
          step={0.01}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandSpawnProbability}
          onUserChange={setBrandSpawnProbability}
          onAnimatedUpdate={setBrandSpawnProbability}
          formatDisplayValue={(value) => value.toFixed(2)}
        />
        <LFOSlider
          label="Tick (ms)"
          min={60}
          max={1000}
          step={10}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandTickMs}
          onUserChange={setBrandTickMs}
          onAnimatedUpdate={setBrandTickMs}
          formatDisplayValue={(value) => `${Math.round(value)}`}
        />
        <LFOSlider
          label="Color Cycle (ms)"
          min={200}
          max={10000}
          step={100}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandColorCycleMs}
          onUserChange={setBrandColorCycleMs}
          onAnimatedUpdate={setBrandColorCycleMs}
          formatDisplayValue={(value) => `${Math.round(value)}`}
        />
        <LFOSlider
          label="Color Attack"
          min={0.5}
          max={20}
          step={0.1}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandColorAttack}
          onUserChange={setBrandColorAttack}
          onAnimatedUpdate={setBrandColorAttack}
          formatDisplayValue={(value) => value.toFixed(1)}
        />
        <LFOSlider
          label="Color Release"
          min={0.5}
          max={20}
          step={0.1}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="a"
          fontSize={12}
          mode="auto"
          showLfoControls
          readExternal={() => brandColorRelease}
          onUserChange={setBrandColorRelease}
          onAnimatedUpdate={setBrandColorRelease}
          formatDisplayValue={(value) => value.toFixed(1)}
        />
      </FloatingPanel>
        </div>
      </AudioAnalysisProvider>
    </FrameLoopProvider>
  )
}

export default App
