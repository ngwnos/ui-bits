import { useEffect, useMemo, useState } from 'react'
import {
  BasicButton,
  FloatingPanel,
  Folder,
  FrameLoopProvider,
  IconButton,
  LFOSlider,
  LoadingBar,
  flexoki,
  sliderColorCombos,
} from 'ui-bits'
import {
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  Paintbrush,
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
    label: 'Slider',
    title: 'Slider',
    code: `const exampleSlider = {
  label: "Example Slider",
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 50,
  colorA: flexoki.orange["500"],
  colorB: flexoki.orange["100"],
  showLfoControls: true,
  drawerOpen: true,
};`,
  },
  { id: 'icon-button', label: 'Icon Button', title: 'Icon Button', code: '' },
  { id: 'loading-bar', label: 'Loading Bar', title: 'Loading Bar', code: '' },
]

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
  const [weatherMode, setWeatherMode] = useState('drizzle')
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
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-brand">
            <DocsBrandCanvas {...brandCanvasProps} />
          </div>
          <Folder
            className="docs-folder"
            label="Components"
            colorA="#AF3029"
            colorB="#FFCABB"
            borderStyle="none"
            transparent
            fontSize={16}
            padding={6}
            verticalGap={6}
          >
            {ROUTES.map((route) => (
              <BasicButton
                key={route.id}
                className="docs-button"
                colorA={route.id === 'icon-button'
                  ? '#F6E2A0'
                  : route.id === 'loading-bar'
                    ? flexoki.green['100']
                    : '#FED3AF'}
                colorB={route.id === 'icon-button'
                  ? '#AD8301'
                  : route.id === 'loading-bar'
                    ? flexoki.green['600']
                    : '#BC5215'}
                borderStyle="none"
                fontSize={16}
                onClick={() => handleNavClick(route.id)}
              >
                {route.label}
              </BasicButton>
            ))}
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
                  border="left"
                  fontSize={12}
                  showLfoControls
                  drawerOpen={exampleDrawerOpen}
                  onDrawerOpenChange={setExampleDrawerOpen}
                />
                <CodeBlock code={activeRoute.code} />
              </div>
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={discreteDrawerOpen}
                    onDrawerOpenChange={setDiscreteDrawerOpen}
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={stepAlignedDrawerOpen}
                    onDrawerOpenChange={setStepAlignedDrawerOpen}
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    drawerOpen={continuousDrawerOpen}
                    onDrawerOpenChange={setContinuousDrawerOpen}
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`barStyle="continuous"\n`} />
                </div>
              </div>
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRange={[20, 80]}
                    drawerOpen={sineDrawerOpen}
                    onDrawerOpenChange={setSineDrawerOpen}
                    lfoRunning
                    initialWaveform="sine"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`initialWaveform="sine"\n`} />
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRange={[20, 80]}
                    drawerOpen={triangleDrawerOpen}
                    onDrawerOpenChange={setTriangleDrawerOpen}
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`initialWaveform="triangle"\n`} />
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRange={[20, 80]}
                    drawerOpen={sawDrawerOpen}
                    onDrawerOpenChange={setSawDrawerOpen}
                    lfoRunning
                    initialWaveform="saw"
                    initialFrequency={0.2}
                    initialPhase={0.5}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`initialWaveform="saw"\n`} />
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRange={[20, 80]}
                    drawerOpen={squareDrawerOpen}
                    onDrawerOpenChange={setSquareDrawerOpen}
                    lfoRunning
                    initialWaveform="square"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`initialWaveform="square"\n`} />
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRange={[20, 80]}
                    drawerOpen={audioDrawerOpen}
                    onDrawerOpenChange={setAudioDrawerOpen}
                    lfoRunning
                    initialWaveform="audio"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`initialWaveform="audio"\n`} />
                </div>
              </div>
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
                    border="left"
                    fontSize={10}
                    showLfoControls
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
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
                    border="left"
                    fontSize={12}
                    showLfoControls
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
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
                    border="left"
                    fontSize={14}
                    showLfoControls
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
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
                    border="left"
                    fontSize={16}
                    showLfoControls
                    lfoRunning
                    initialWaveform="triangle"
                    initialFrequency={0.1}
                    barStyle="continuous"
                  />
                  <CodeBlock code={`fontSize={16}\n`} />
                </div>
              </div>
            </>
          ) : activeRouteId === 'icon-button' ? (
            <>
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
                  <CodeBlock code={`<IconButton fontSize={16} colorA={flexoki.orange["600"]} colorB={flexoki.orange["150"]}>\n  <Paintbrush />\n</IconButton>`} />
                </div>
                <div className="docs-icon-item">
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
                  <CodeBlock code={`<IconButton behavior="toggle" toggled={checked} onToggle={setChecked}>\n  {checked ? <SquareCheckBig /> : <Square />}\n</IconButton>`} />
                </div>
                <div className="docs-icon-item">
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
                  <CodeBlock code={`<IconButton behavior="cycle" options={weatherOptions} value={weather} onChange={setWeather} />`} />
                </div>
              </div>
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
            </>
          ) : activeRouteId === 'loading-bar' ? (
            <div className="docs-code-section">
              <LoadingBar
                value={loadingBarValue}
                width="100%"
                colorA={flexoki.green['600']}
                colorB={flexoki.green['100']}
                border="left"
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
                border="left"
                fontSize={12}
                onUserChange={setLoadingBarValue}
                onAnimatedUpdate={setLoadingBarValue}
                formatDisplayValue={(value) => value.toFixed(2)}
              />
              <CodeBlock code={activeRoute.code} />
            </div>
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
            border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
          border="left"
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
    </FrameLoopProvider>
  )
}

export default App
