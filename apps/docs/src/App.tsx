import { useEffect, useMemo, useState } from 'react'
import { BasicButton, FloatingPanel, Folder, FrameLoopProvider, LFOSlider, flexoki } from 'ui-bits'
import CodeBlock from './components/CodeBlock'
import DocsBrandCanvas, { type DocsBrandCanvasProps } from './components/DocsBrandCanvas'
import './App.css'

const ROUTES = [
  { id: 'slider', label: 'Slider', title: 'Slider', code: '' },
  { id: 'icon-button', label: 'Icon Button', title: 'Icon Button', code: '' },
]

const getRouteFromHash = () => {
  if (typeof window === 'undefined') return ROUTES[0]
  const hash = window.location.hash.replace('#', '').replace('/', '')
  return ROUTES.find((route) => route.id === hash) ?? ROUTES[0]
}

function App() {
  const [activeRouteId, setActiveRouteId] = useState(() => getRouteFromHash().id)
  const [brandDivisions, setBrandDivisions] = useState(25)
  const [brandTextWidth, setBrandTextWidth] = useState(1.6)
  const [brandTextSpacing, setBrandTextSpacing] = useState(0.5)
  const [brandTextGain, setBrandTextGain] = useState(2)
  const [brandTextBlur, setBrandTextBlur] = useState(0)
  const [brandSpawnProbability, setBrandSpawnProbability] = useState(0.35)
  const [brandTickMs, setBrandTickMs] = useState(200)
  const [brandColorAttack, setBrandColorAttack] = useState(10)
  const [brandColorRelease, setBrandColorRelease] = useState(2)
  const brandPalette = useMemo(
    () => [
      flexoki.red['600'],
      flexoki.yellow['600'],
    ],
    [],
  )
  const brandBackground = flexoki.base['950']
  const brandTextColor = flexoki.base['50']
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
          >
            {ROUTES.map((route) => (
              <BasicButton
                key={route.id}
                className="docs-button"
                colorA={route.id === 'icon-button' ? '#F6E2A0' : '#FED3AF'}
                colorB={route.id === 'icon-button' ? '#AD8301' : '#BC5215'}
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
          <CodeBlock code={activeRoute.code} />
        </main>
        <FloatingPanel
          className="docs-panel"
          title="Shader"
          collapsible
          showDockButton
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
          defaultPosition={{ x: 280, y: 24 }}
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
          max={20}
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
