import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BasicButton,
  AudioAnalysisProvider,
  createAudioAnalysisStore,
  AudioControls,
  ColorField,
  Dropdown,
  IconDropdown,
  FloatingPanel,
  Folder,
  FrameLoopProvider,
  IconButton,
  KeyValueAccordion,
  KeyValueRows,
  LFOSlider,
  LoadingBar,
  NameInputRow,
  PresetManager,
  PresetStoreProvider,
  RadioList,
  SliderStoreProvider,
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
import SelectionGridExample from './components/SelectionGridExample'
import { ROUTES } from './routes'
import './App.css'

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
  const radioListOptions = useMemo(() => ([
    { value: 'draft', label: 'Draft', description: 'Draft output' },
    { value: 'balanced', label: 'Balanced', description: 'Balanced output' },
    { value: 'quality', label: 'Quality', description: 'Quality output' },
    { value: 'locked', label: 'Locked', description: 'Disabled', disabled: true },
  ]), [])
  const radioListCompactOptions = useMemo(() => ([
    { value: 'mono', label: 'Mono' },
    { value: 'stereo', label: 'Stereo' },
    { value: 'surround', label: 'Surround' },
  ]), [])
  const radioListDenseOptions = useMemo(() => ([
    { value: 'eco', label: 'Eco' },
    { value: 'fast', label: 'Fast' },
    { value: 'normal', label: 'Normal' },
    { value: 'safe', label: 'Safe' },
    { value: 'turbo', label: 'Turbo' },
    { value: 'custom', label: 'Custom' },
  ]), [])
  const keyValueRowsData = useMemo(() => ([
    { key: 'status', label: 'Status', value: 'Available' },
    { key: 'fps', label: 'FPS', value: '60' },
    { key: 'adapter', label: 'Adapter', value: 'Default' },
    { key: 'max-tex-2d', label: 'Max Texture 2D', value: '8,192' },
    { key: 'max-tex-3d', label: 'Max Texture 3D', value: '2,048' },
    { key: 'max-buffer', label: 'Max Buffer Size', value: '256 MB' },
  ]), [])
  const keyValueRowsStats = useMemo(() => ([
    { key: 'map-size', label: 'Map Size', value: '05 / 10' },
    { key: 'cities', label: 'Cities', value: '12 / 24' },
    { key: 'characters', label: 'Characters', value: '28 / 50' },
    { key: 'side-quests', label: 'Side Quests', value: '09 / 20' },
  ]), [])
  const accordionProfileOptions = useMemo(() => ([
    { value: 'draft', label: 'Draft' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'quality', label: 'Quality' },
  ]), [])
  const accordionLimiterOptions = useMemo(() => ([
    { value: 'off', label: 'Off' },
    { value: 'on', label: 'On' },
  ]), [])
  const dropdownOptions = useMemo(() => ([
    { value: 'sine', label: 'Sine' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'square', label: 'Square', disabled: true },
  ]), [])
  const dropdownSubtextOptions = useMemo(() => ([
    { value: 'draft', label: 'Draft', description: 'Draft output' },
    { value: 'balanced', label: 'Balanced', description: 'Balanced output' },
    { value: 'quality', label: 'Quality', description: 'Quality output' },
    { value: 'safe', label: 'Safe', description: 'Disabled', disabled: true },
  ]), [])
  const nestedDropdownOptions = useMemo(() => (
    Array.from({ length: 24 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0')
      const isExtendedLabel = index === 11
      return {
        value: `destination-${number}`,
        label: isExtendedLabel
          ? `Destination ${number} - Macro ${number} - Ultra-wide modulation routing lane`
          : `Destination ${number} - Macro ${number}`,
      }
    })
  ), [])
  const iconDropdownOptions = useMemo(() => ([
    { value: 'drizzle', label: 'Drizzle', icon: <CloudDrizzle /> },
    { value: 'lightning', label: 'Lightning', icon: <CloudLightning /> },
    { value: 'snow', label: 'Snow', icon: <CloudSnow /> },
    { value: 'sun', label: 'Sun', icon: <Sun /> },
  ]), [])
  const [waveformValue, setWaveformValue] = useState('sine')
  const [subtextDropdownValue, setSubtextDropdownValue] = useState('balanced')
  const [radioListValue, setRadioListValue] = useState('balanced')
  const [radioListCompactValue, setRadioListCompactValue] = useState('stereo')
  const [radioListDenseValue, setRadioListDenseValue] = useState('normal')
  const [iconDropdownValue, setIconDropdownValue] = useState('drizzle')
  const [nestedDropdownValue, setNestedDropdownValue] = useState('destination-01')
  const [colorFieldValue, setColorFieldValue] = useState('#d14d41')
  const [accordionProfileValue, setAccordionProfileValue] = useState('balanced')
  const [accordionRoutingValue, setAccordionRoutingValue] = useState('stereo')
  const [accordionLimiterValue, setAccordionLimiterValue] = useState('on')
  const [accordionSingleExpandedKeys, setAccordionSingleExpandedKeys] = useState<string[]>([
    'single-world',
  ])
  const keyValueAccordionItems = useMemo(() => ([
    {
      key: 'render-profile',
      label: 'Render Profile',
      value: accordionProfileOptions.find((option) => option.value === accordionProfileValue)?.label
        ?? accordionProfileValue,
      defaultExpanded: true,
      children: (
        <Dropdown
          label="Profile"
          labelInline
          options={accordionProfileOptions}
          value={accordionProfileValue}
          onChange={(value) => setAccordionProfileValue(value)}
          borderStyle="a"
          fontSize={12}
        />
      ),
    },
    {
      key: 'output-routing',
      label: 'Output Routing',
      value: radioListCompactOptions.find((option) => option.value === accordionRoutingValue)?.label
        ?? accordionRoutingValue,
      children: (
        <RadioList
          label="Routing"
          showLabel
          options={radioListCompactOptions}
          value={accordionRoutingValue}
          onChange={(value) => setAccordionRoutingValue(value)}
          maxListHeight={120}
          borderStyle="a"
          fontSize={12}
        />
      ),
    },
    {
      key: 'limiter',
      label: 'Limiter',
      value: accordionLimiterValue === 'on' ? 'On' : 'Off',
      children: (
        <>
          <SegmentBar
            options={accordionLimiterOptions}
            value={accordionLimiterValue}
            onChange={(value) => setAccordionLimiterValue(value)}
            borderStyle="a"
            fontSize={12}
          />
          <LFOSlider
            label="Ceiling"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.93}
            width="100%"
            border="a"
            fontSize={12}
          />
        </>
      ),
    },
  ]), [
    accordionLimiterOptions,
    accordionLimiterValue,
    accordionProfileOptions,
    accordionProfileValue,
    accordionRoutingValue,
    radioListCompactOptions,
  ])
  const keyValueAccordionSingleItems = useMemo(() => ([
    {
      key: 'single-world',
      label: 'World Scale',
      value: 'Large',
      children: (
        <Dropdown
          label="Scale"
          labelInline
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          defaultValue="large"
          borderStyle="a"
          fontSize={12}
        />
      ),
    },
    {
      key: 'single-terrain',
      label: 'Terrain Detail',
      value: '0.62',
      children: (
        <LFOSlider
          label="Detail"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0.62}
          width="100%"
          border="a"
          fontSize={12}
        />
      ),
    },
    {
      key: 'single-fog',
      label: 'Fog Density',
      value: 'Low',
      children: (
        <SegmentBar
          options={[
            { value: 'off', label: 'Off' },
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' },
          ]}
          defaultValue="low"
          borderStyle="a"
          fontSize={12}
        />
      ),
    },
  ]), [])
  const randomWorldNamePool = useMemo(() => ([
    'Ironwake Reach',
    'Ashen Hollow',
    'Starfall Basin',
    'Copper Fen',
    'Mireglass Coast',
    'Thornspire Vale',
  ]), [])
  const randomFactionNamePool = useMemo(() => ([
    'The Ember Cartel',
    'Order of Glass',
    'Ravenbound Circle',
    'Verdant Host',
    'Guild of the Ninth Bridge',
  ]), [])
  const [worldNameInputValue, setWorldNameInputValue] = useState('')
  const [factionNameInputValue, setFactionNameInputValue] = useState('')
  const [createdWorldNames, setCreatedWorldNames] = useState<string[]>([])
  const [createdFactionNames, setCreatedFactionNames] = useState<string[]>([])
  const getRandomWorldName = useCallback(() => (
    randomWorldNamePool[Math.floor(Math.random() * randomWorldNamePool.length)] ?? ''
  ), [randomWorldNamePool])
  const getRandomFactionName = useCallback(() => (
    randomFactionNamePool[Math.floor(Math.random() * randomFactionNamePool.length)] ?? ''
  ), [randomFactionNamePool])
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
                  LFOSlider supports uncontrolled, controlled, and store-bound use. Use{" "}
                  <code>defaultValue</code> for local state, <code>value</code> with{" "}
                  <code>onUserChange</code> for parent state, or <code>controlId</code> for the shared
                  slider store.
                </p>
                <p>
                  <code>showLfoControls</code> adds waveform and range controls.{" "}
                  <code>onAnimatedUpdate</code> reports frame-time values when the LFO is running.
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
                  IconButton supports momentary, toggle, and cycle modes. Cycle mode reads{" "}
                  <code>options</code> and emits the selected option value through{" "}
                  <code>onChange</code>.
                </p>
                <p>
                  Use <code>defaultPressed</code> or <code>defaultToggled</code> for local state, or{" "}
                  <code>pressed</code>/<code>toggled</code> with callbacks for controlled state.{" "}
                  <code>borderStyle</code> and <code>borderMask</code> control how the button joins
                  adjacent controls.
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
                  LoadingBar renders a <code>value</code> between <code>0</code> and <code>1</code>.
                  It does not handle input.
                </p>
                <p>
                  Use <code>barStyle</code> and <code>barSegmentCount</code> for the fill style. Set{" "}
                  <code>colorA</code>/<code>colorB</code> to match surrounding controls.
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
                  AudioControls creates or uses an analysis store for a buffer, media stream, or{" "}
                  <code>AudioNode</code> source. Wrap related controls in{" "}
                  <code>AudioAnalysisProvider</code> or pass <code>audioAnalysisStore</code> directly
                  to share FFT data.
                </p>
                <p>
                  Sliders with <code>defaultWaveform="audio"</code> read that analysis data. Use
                  controlled props such as <code>playing</code>, <code>binCount</code>, and{" "}
                  <code>binInterpolation</code> only when the host owns those values.
                </p>
                <p>
                  VirtualKeyboard can use Tone.js or SoundFont options. Pass a destination node when
                  keyboard output should feed the same AudioControls analysis path.
                </p>
              </div>
            </>
          ) : activeRouteId === 'segment-bar' ? (
            <>
              <div className="docs-code-section">
                <SegmentBar
                  label="Band"
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
                  SegmentBar renders one selected option from a fixed option list. Use{" "}
                  <code>defaultValue</code> for local state or <code>value</code>/<code>onChange</code>{" "}
                  for controlled state.
                </p>
                <p>
                  It supports keyboard navigation and the same color and border props as the other
                  controls.
                </p>
              </div>
            </>
          ) : activeRouteId === 'radio-list' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-radio-stack">
                  <RadioList
                    label="Render Profile"
                    showLabel
                    options={radioListOptions}
                    value={radioListValue}
                    onChange={(value) => setRadioListValue(value)}
                    colorA={flexoki.blue['600']}
                    colorB={flexoki.blue['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <RadioList
                    label="Render Profile (2 Columns)"
                    showLabel
                    options={radioListOptions}
                    value={radioListValue}
                    onChange={(value) => setRadioListValue(value)}
                    columns={2}
                    colorA={flexoki.blue['600']}
                    colorB={flexoki.blue['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <RadioList
                    label="Output Routing"
                    showLabel
                    options={radioListCompactOptions}
                    value={radioListCompactValue}
                    onChange={(value) => setRadioListCompactValue(value)}
                    colorA={flexoki.cyan['600']}
                    colorB={flexoki.cyan['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <RadioList
                    label="Mode Presets (3 Columns)"
                    showLabel
                    options={radioListDenseOptions}
                    value={radioListDenseValue}
                    onChange={(value) => setRadioListDenseValue(value)}
                    columns={3}
                    colorA={flexoki.purple['600']}
                    colorB={flexoki.purple['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<RadioList
  label="Render Profile (2 Columns)"
  showLabel
  options={options}
  value={value}
  onChange={(nextValue) => setValue(nextValue)}
  columns={2}
  colorA={flexoki.blue["600"]}
  colorB={flexoki.blue["100"]}
  borderStyle="a"
  fontSize={12}
/>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  RadioList renders one selected value from an option list. Descriptions and disabled
                  options are supported.
                </p>
                <p>
                  Use <code>defaultValue</code> for local state or <code>value</code>/<code>onChange</code>{" "}
                  for controlled state. Set <code>columns</code> when the list needs a denser layout.
                </p>
              </div>
            </>
          ) : activeRouteId === 'key-value-rows' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-radio-stack">
                  <KeyValueRows
                    rows={keyValueRowsData}
                    colorA={flexoki.green['600']}
                    colorB={flexoki.green['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <KeyValueRows
                    rows={keyValueRowsStats}
                    colorA={flexoki.purple['600']}
                    colorB={flexoki.purple['100']}
                    borderStyle="b"
                    fontSize={12}
                  />
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<KeyValueRows
  rows={rows}
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="b"
  fontSize={12}
  rowHeight={26}
/>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  KeyValueRows renders read-only label/value rows in one bordered surface.
                </p>
                <p>
                  Use it for status or metadata. It is not selectable and has no state model.
                </p>
              </div>
            </>
          ) : activeRouteId === 'key-value-accordion' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-radio-stack">
                  <KeyValueAccordion
                    items={keyValueAccordionItems}
                    mode="multiple"
                    colorA={flexoki.blue['600']}
                    colorB={flexoki.blue['100']}
                    borderStyle="a"
                    fontSize={12}
                    padding={8}
                    verticalGap={6}
                  />
                  <KeyValueAccordion
                    items={keyValueAccordionSingleItems}
                    mode="single"
                    expandedKeys={accordionSingleExpandedKeys}
                    onExpandedKeysChange={(keys) => setAccordionSingleExpandedKeys(keys)}
                    colorA={flexoki.cyan['600']}
                    colorB={flexoki.cyan['100']}
                    borderStyle="a"
                    fontSize={12}
                    padding={8}
                    verticalGap={6}
                  />
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<KeyValueAccordion
  items={items}
  mode="single"
  expandedKeys={expandedKeys}
  onExpandedKeysChange={(keys) => setExpandedKeys(keys)}
  colorA={flexoki.cyan["600"]}
  colorB={flexoki.cyan["100"]}
  borderStyle="a"
  fontSize={12}
  padding={8}
  verticalGap={6}
/>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  KeyValueAccordion renders label/value rows that can expand to show controls or
                  custom content.
                </p>
                <p>
                  <code>mode="multiple"</code> allows several open rows. <code>mode="single"</code>{" "}
                  keeps one row open. Use <code>expandedKeys</code>/<code>onExpandedKeysChange</code>{" "}
                  to control expansion.
                </p>
              </div>
            </>
          ) : activeRouteId === 'name-input-row' ? (
            <>
              <div className="docs-code-section">
                <div className="docs-radio-stack">
                  <NameInputRow
                    value={worldNameInputValue}
                    onValueChange={setWorldNameInputValue}
                    placeholder="New world..."
                    onCreate={(name) => {
                      setCreatedWorldNames((prev) => [name, ...prev].slice(0, 6))
                    }}
                    onRandomize={getRandomWorldName}
                    colorA={flexoki.orange['600']}
                    colorB={flexoki.orange['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <KeyValueRows
                    rows={createdWorldNames.map((name, index) => ({
                      key: `world-${index}-${name}`,
                      label: `World ${String(index + 1).padStart(2, '0')}`,
                      value: name,
                    }))}
                    emptyLabel="No created world names"
                    colorA={flexoki.orange['600']}
                    colorB={flexoki.orange['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <NameInputRow
                    value={factionNameInputValue}
                    onValueChange={setFactionNameInputValue}
                    placeholder="Faction..."
                    onCreate={(name) => {
                      setCreatedFactionNames((prev) => [name, ...prev].slice(0, 6))
                    }}
                    onRandomize={getRandomFactionName}
                    randomizeMode="append"
                    appendSeparator=" of "
                    colorA={flexoki.cyan['600']}
                    colorB={flexoki.cyan['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <KeyValueRows
                    rows={createdFactionNames.map((name, index) => ({
                      key: `faction-${index}-${name}`,
                      label: `Faction ${String(index + 1).padStart(2, '0')}`,
                      value: name,
                    }))}
                    emptyLabel="No created faction names"
                    colorA={flexoki.cyan['600']}
                    colorB={flexoki.cyan['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<NameInputRow
  value={factionName}
  onValueChange={setFactionName}
  placeholder="Faction..."
  onCreate={(name) => saveFaction(name)}
  onRandomize={() => randomFactionName()}
  randomizeMode="append"
  appendSeparator=" of "
  colorA={flexoki.cyan["600"]}
  colorB={flexoki.cyan["100"]}
  borderStyle="a"
  fontSize={12}
/>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  NameInputRow combines a text input, create action, and optional randomize action.
                </p>
                <p>
                  <code>onCreate</code> receives the current text. <code>onRandomize</code> may return
                  a string directly or asynchronously; <code>randomizeMode="append"</code> appends it
                  to the current value.
                </p>
              </div>
            </>
          ) : activeRouteId === 'selection-grid' ? (
            <>
              <div className="docs-code-section">
                <SliderStoreProvider>
                  <div className="docs-selection-grid-stack">
                    <SelectionGridExample />
                  </div>
                </SliderStoreProvider>
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  SelectionGrid renders selectable square items. Provide <code>getKey</code>,{" "}
                  <code>getLabel</code>, and <code>getPreview</code> so it can stay data-agnostic.
                </p>
                <p>
                  GradientSelectionGrid is the gradient-specific variant. Pass{" "}
                  <code>terrainAssets</code> from the host app when terrain previews are needed; the
                  package does not bundle terrain images.
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
                  <Dropdown
                    label="Render Profile"
                    options={dropdownSubtextOptions}
                    value={subtextDropdownValue}
                    onChange={(value) => setSubtextDropdownValue(value)}
                    colorA={flexoki.purple['600']}
                    colorB={flexoki.purple['100']}
                    borderStyle="a"
                    fontSize={12}
                    width={280}
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
                  <FloatingPanel
                    title="Nested Dropdown"
                    colorA={flexoki.purple['600']}
                    colorB={flexoki.purple['100']}
                    borderStyle="a"
                    fontSize={12}
                    width={320}
                    verticalGap={6}
                    paddingLeft={3}
                    paddingRight={3}
                    paddingBottom={3}
                  >
                    <Folder
                      label="Folder Container"
                      colorA={flexoki.purple['600']}
                      colorB={flexoki.purple['100']}
                    >
                      <Dropdown
                        label="Long Menu"
                        labelInline
                        options={nestedDropdownOptions}
                        value={nestedDropdownValue}
                        onChange={(value) => setNestedDropdownValue(value)}
                        colorA={flexoki.purple['600']}
                        colorB={flexoki.purple['100']}
                        borderStyle="a"
                        fontSize={12}
                      />
                    </Folder>
                  </FloatingPanel>
                </div>
                <div className="docs-code-stack">
                  <CodeBlock code={activeRoute.code} />
                  <CodeBlock
                    code={`<Dropdown
  label="Render Profile"
  options={[
    { value: "draft", label: "Draft", description: "Draft output" },
    { value: "balanced", label: "Balanced", description: "Balanced output" },
    { value: "quality", label: "Quality", description: "Quality output" },
  ]}
  value={profile}
  onChange={(value) => setProfile(value)}
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="a"
  fontSize={12}
  width={280}
/>`}
                  />
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
                  <CodeBlock
                    code={`const longOptions = Array.from({ length: 24 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0")
  const isExtendedLabel = index === 11
  return {
    value: \`destination-\${number}\`,
    label: isExtendedLabel
      ? \`Destination \${number} - Macro \${number} - Ultra-wide modulation routing lane\`
      : \`Destination \${number} - Macro \${number}\`,
  }
})

<FloatingPanel
  title="Nested Dropdown"
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="a"
  fontSize={12}
  width={320}
>
  <Folder
    label="Folder Container"
    colorA={flexoki.purple["600"]}
    colorB={flexoki.purple["100"]}
  >
    <Dropdown
      label="Long Menu"
      labelInline
      options={longOptions}
      value={nestedDropdownValue}
      onChange={(value) => setNestedDropdownValue(value)}
      colorA={flexoki.purple["600"]}
      colorB={flexoki.purple["100"]}
      borderStyle="a"
      fontSize={12}
    />
  </Folder>
</FloatingPanel>`}
                  />
                </div>
              </div>
              <div className="docs-text-block">
                <p>
                  Dropdown renders a labelled menu from an explicit option list. Use{" "}
                  <code>defaultValue</code> for local state or <code>value</code>/<code>onChange</code>{" "}
                  for controlled state.
                </p>
                <p>
                  IconDropdown uses the same option contract with an icon trigger. Use{" "}
                  <code>showMenuIcons</code> when option icons should appear inside the menu.
                </p>
              </div>
            </>
          ) : activeRouteId === 'color-field' ? (
            <>
              <div className="docs-code-section">
                <div
                  style={{
                    width: '100%',
                    maxWidth: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <ColorField
                    label="Accent"
                    value={colorFieldValue}
                    onChange={(next) => setColorFieldValue(next)}
                    defaultAlpha={220}
                    colorA={flexoki.red['600']}
                    colorB={flexoki.red['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                  <ColorField
                    label="Accent (Popup)"
                    value={colorFieldValue}
                    onChange={(next) => setColorFieldValue(next)}
                    pickerDisplay="popup"
                    colorA={flexoki.red['600']}
                    colorB={flexoki.red['100']}
                    borderStyle="a"
                    fontSize={12}
                  />
                </div>
                <CodeBlock code={activeRoute.code} />
              </div>
              <div className="docs-text-block">
                <p>
                  ColorField binds a hex color and optional alpha value in one row.
                </p>
                <p>
                  The picker is inline by default. Set <code>pickerDisplay="popup"</code> to open it
                  from the swatch.
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
                    showOpacityControl
                    defaultBodyOpacity={0.85}
                    bodyBlur={0}
                    verticalGap={6}
                    paddingLeft={3}
                    paddingRight={3}
                    paddingBottom={3}
                  >
                    <PresetManager maxListHeight={120} />
                    <ColorField label="Accent" ariaLabel="Accent color" />
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
                  FloatingPanel renders a header and body for stacked controls. <code>title</code>{" "}
                  creates the default header; <code>header</code> replaces it with custom content.
                </p>
                <p>
                  <code>collapsible</code> controls body visibility. <code>draggable</code> and{" "}
                  <code>showDockButton</code> add panel movement and docking. <code>padding</code>{" "}
                  and <code>verticalGap</code> control body spacing.
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
