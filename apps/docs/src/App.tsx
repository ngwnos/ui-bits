import { useEffect, useMemo, useState } from 'react'
import { BasicButton, FloatingPanel, Folder, LFOSlider } from 'ui-bits'
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
  const [brandDivisions, setBrandDivisions] = useState(12)
  const [brandDitherWidth, setBrandDitherWidth] = useState(0.18)
  const [brandDitherStrength, setBrandDitherStrength] = useState(0.65)
  const [brandSeed, setBrandSeed] = useState(0)
  const [brandLeftColor] = useState('#1C1B1A')
  const [brandRightColor] = useState('#282726')
  const activeRoute = useMemo(
    () => ROUTES.find((route) => route.id === activeRouteId) ?? ROUTES[0],
    [activeRouteId],
  )
  const brandCanvasProps = useMemo<DocsBrandCanvasProps>(() => ({
    divisions: brandDivisions,
    ditherWidth: brandDitherWidth,
    ditherStrength: brandDitherStrength,
    seed: brandSeed,
    leftColor: brandLeftColor,
    rightColor: brandRightColor,
  }), [
    brandDivisions,
    brandDitherWidth,
    brandDitherStrength,
    brandSeed,
    brandLeftColor,
    brandRightColor,
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
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <div className="docs-brand">
          <DocsBrandCanvas {...brandCanvasProps} />
          <div className="docs-brand-content">
            <span className="docs-brand-text">ui-bits</span>
          </div>
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
          mode="external"
          readExternal={() => brandDivisions}
          onUserChange={(value) => setBrandDivisions(Math.round(value))}
          onAnimatedUpdate={(value) => setBrandDivisions(Math.round(value))}
          formatDisplayValue={(value) => `${Math.round(value)}`}
        />
        <LFOSlider
          label="Dither"
          min={0}
          max={0.5}
          step={0.01}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="left"
          fontSize={12}
          mode="external"
          readExternal={() => brandDitherWidth}
          onUserChange={setBrandDitherWidth}
          onAnimatedUpdate={setBrandDitherWidth}
          formatDisplayValue={(value) => value.toFixed(2)}
        />
        <LFOSlider
          label="Strength"
          min={0}
          max={1}
          step={0.01}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="left"
          fontSize={12}
          mode="external"
          readExternal={() => brandDitherStrength}
          onUserChange={setBrandDitherStrength}
          onAnimatedUpdate={setBrandDitherStrength}
          formatDisplayValue={(value) => value.toFixed(2)}
        />
        <LFOSlider
          label="Seed"
          min={0}
          max={10}
          step={0.1}
          width="100%"
          colorA="#F2F0E5"
          colorB="#282726"
          border="left"
          fontSize={12}
          mode="external"
          readExternal={() => brandSeed}
          onUserChange={setBrandSeed}
          onAnimatedUpdate={setBrandSeed}
          formatDisplayValue={(value) => value.toFixed(1)}
        />
      </FloatingPanel>
    </div>
  )
}

export default App
