export type DocsRoute = {
  id: string
  label: string
  title: string
  code: string
  snippets?: Record<string, string>
}

export const routeSnippet = (route: DocsRoute, key = 'main') => (
  key === 'main' ? route.code : route.snippets?.[key] ?? ''
)

export const ROUTES: DocsRoute[] = [
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
    snippets: {
      discrete: `barStyle="discrete"
barSegmentCount={32}`,
      stepAligned: `barStyle="step-aligned"`,
      continuous: `barStyle="continuous"`,
      sine: `defaultWaveform="sine"
defaultFrequency={0.2}
defaultLfoRange={[20, 80]}`,
      triangle: `defaultWaveform="triangle"
defaultFrequency={0.2}
defaultLfoRange={[20, 80]}`,
      saw: `defaultWaveform="saw"
defaultFrequency={0.4}
defaultPhase={0.5}
defaultLfoRange={[20, 80]}`,
      square: `defaultWaveform="square"
defaultFrequency={0.4}
defaultLfoRange={[20, 80]}`,
      audio: `defaultWaveform="audio"
defaultFrequency={0.2}
defaultLfoRange={[20, 80]}`,
    },
  },
  {
    id: 'icon-button',
    label: 'Icon Button',
    title: 'Icon Button',
    code: `<IconButton
  behavior="cycle"
  options={[
    { value: "dark", icon: <MoonStar /> },
    { value: "light", icon: <Sun /> },
  ]}
  value="dark"
  onChange={(value) => setThemeMode(value)}
/>`,
    snippets: {
      momentary: `behavior="momentary"`,
      toggle: `behavior="toggle"`,
      cycle: `behavior="cycle"`,
    },
  },
  {
    id: 'loading-bar',
    label: 'Loading Bar',
    title: 'Loading Bar',
    code: `<LoadingBar
  value={progress}
  colorA={flexoki.green["600"]}
  colorB={flexoki.green["100"]}
  border="a"
  fontSize={12}
  barStyle="discrete"
  barSegmentCount={24}
/>`,
  },
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
    snippets: {
      analysis: `<AudioAnalysisProvider>
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
</AudioAnalysisProvider>`,
      liveInput: `const keyboardOutput = masterGain

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
/>`,
    },
  },
  {
    id: 'segment-bar',
    label: 'Segment Bar',
    title: 'Segment Bar',
    code: `<SegmentBar
  label="Band"
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
    id: 'radio-list',
    label: 'Radio List',
    title: 'Radio List',
    code: `const options = [
  { value: "manual", label: "Manual", description: "User controlled" },
  { value: "auto", label: "Auto", description: "Host controlled" },
  { value: "follow", label: "Follow", description: "Linked control" },
  { value: "locked", label: "Locked", description: "Disabled", disabled: true },
];

const [value, setValue] = useState("auto");

<RadioList
  label="Control Mode"
  showLabel
  options={options}
  value={value}
  onChange={(nextValue) => setValue(nextValue)}
  colorA={flexoki.blue["600"]}
  colorB={flexoki.blue["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
    snippets: {
      columns: `<RadioList
  label="Control Mode (2 Columns)"
  showLabel
  options={options}
  value={value}
  onChange={(nextValue) => setValue(nextValue)}
  columns={2}
  colorA={flexoki.blue["600"]}
  colorB={flexoki.blue["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
    },
  },
  {
    id: 'key-value-rows',
    label: 'Key/Value Rows',
    title: 'Key/Value Rows',
    code: `const rows = [
  { key: "status", label: "Status", value: "Available" },
  { key: "fps", label: "FPS", value: "60" },
  { key: "adapter", label: "Adapter", value: "Default" },
  { key: "max-tex-2d", label: "Max Texture 2D", value: "8,192" },
];

<KeyValueRows
  rows={rows}
  colorA={flexoki.green["600"]}
  colorB={flexoki.green["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
    snippets: {
      bordered: `<KeyValueRows
  rows={rows}
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="b"
  fontSize={12}
  rowHeight={26}
/>`,
    },
  },
  {
    id: 'key-value-accordion',
    label: 'Key/Value Accordion',
    title: 'Key/Value Accordion',
    code: `const items = [
  {
    key: "preset",
    label: "Preset",
    value: "Bright",
    defaultExpanded: true,
    children: (
      <Dropdown
        label="Profile"
        labelInline
        options={[
          { value: "clean", label: "Clean" },
          { value: "bright", label: "Bright" },
          { value: "wide", label: "Wide" },
        ]}
        value={profile}
        onChange={(value) => setProfile(value)}
      />
    ),
  },
  {
    key: "modulation",
    label: "Modulation",
    value: "0.45",
    children: (
      <LFOSlider
        label="Depth"
        min={0}
        max={1}
        step={0.01}
        defaultValue={0.45}
        width="100%"
      />
    ),
  },
];

<KeyValueAccordion
  items={items}
  mode="multiple"
  colorA={flexoki.blue["600"]}
  colorB={flexoki.blue["100"]}
  borderStyle="a"
  fontSize={12}
  padding={8}
  verticalGap={6}
/>`,
    snippets: {
      single: `<KeyValueAccordion
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
/>`,
    },
  },
  {
    id: 'name-input-row',
    label: 'Name Input Row',
    title: 'Name Input Row',
    code: `const randomPresetNames = [
  "Clean Lead",
  "Soft Pad",
  "Short Delay",
  "Wide Chorus",
  "Low Drone",
]

const [createdNames, setCreatedNames] = useState<string[]>([])

<NameInputRow
  placeholder="Preset name..."
  onCreate={(name) => setCreatedNames((prev) => [name, ...prev].slice(0, 6))}
  onRandomize={() => randomPresetNames[Math.floor(Math.random() * randomPresetNames.length)] ?? ""}
  colorA={flexoki.orange["600"]}
  colorB={flexoki.orange["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
    snippets: {
      append: `<NameInputRow
  value={tagName}
  onValueChange={setTagName}
  placeholder="Tag..."
  onCreate={(name) => saveTag(name)}
  onRandomize={() => randomTag()}
  randomizeMode="append"
  appendSeparator=" / "
  colorA={flexoki.cyan["600"]}
  colorB={flexoki.cyan["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
    },
  },
  {
    id: 'selection-grid',
    label: 'Selection Grid',
    title: 'Selection Grid',
    code: `const items = [
  { id: "rose", label: "Rose", color: "#D14D41" },
  { id: "sun", label: "Sun", color: "#E2C37C" },
  { id: "mint", label: "Mint", color: "#73A27E" },
  { id: "sky", label: "Sky", color: "#5B88B3" },
];

const [selectedKey, setSelectedKey] = useState(items[0]?.id ?? null);
const folders = [
  { id: "warm", label: "Warm", items: [items[0], items[1]] },
  { id: "cool", label: "Cool", items: [items[2], items[3]], defaultCollapsed: true },
];

<SelectionGrid
  items={items}
  getKey={(item) => item.id}
  getLabel={(item) => item.label}
  getPreview={(item) => ({ type: "color", color: item.color })}
  selectedKey={selectedKey}
  onSelect={(key) => setSelectedKey(key)}
  layoutGap="6px"
  colorA={flexoki.base["50"]}
  colorB={flexoki.base["100"]}
/>

<SelectionGrid
  folders={folders}
  getKey={(item) => item.id}
  getLabel={(item) => item.label}
  getPreview={(item) => ({ type: "color", color: item.color })}
  selectedKey={selectedKey}
  onSelect={(key) => setSelectedKey(key)}
  layoutGap="6px"
  colorA={flexoki.base["700"]}
  colorB={flexoki.base["100"]}
/>

<GradientSelectionGrid
  previewDarkMode
  terrainAssets={loadDocsTerrainTileAssets}
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
    snippets: {
      subtext: `<Dropdown
  label="Buffer Mode"
  options={[
    { value: "low-latency", label: "Low Latency", description: "Small buffer" },
    { value: "balanced", label: "Balanced", description: "Default buffer" },
    { value: "large-buffer", label: "Large Buffer", description: "Larger buffer" },
  ]}
  value={bufferMode}
  onChange={(value) => setBufferMode(value)}
  colorA={flexoki.purple["600"]}
  colorB={flexoki.purple["100"]}
  borderStyle="a"
  fontSize={12}
  width={280}
/>`,
      icon: `<IconDropdown
  label="Status"
  options={[
    { value: "idle", label: "Idle", icon: <Square /> },
    { value: "active", label: "Active", icon: <SquareCheckBig /> },
    { value: "muted", label: "Muted", icon: <PowerOff /> },
    { value: "armed", label: "Armed", icon: <Power /> },
  ]}
  value="idle"
  onChange={(value) => setIconDropdownValue(value)}
  colorA={flexoki.cyan["600"]}
  colorB={flexoki.cyan["100"]}
  borderStyle="a"
  fontSize={12}
  showMenuIcons
/>`,
      nested: `const longOptions = Array.from({ length: 24 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0")
  const isExtendedLabel = index === 11
  return {
    value: \`output-\${number}\`,
    label: isExtendedLabel
      ? \`Output \${number} - Auxiliary return with a long label\`
      : \`Output \${number} - Bus \${number}\`,
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
    label="Routing"
    colorA={flexoki.purple["600"]}
    colorB={flexoki.purple["100"]}
  >
    <Dropdown
      label="Output"
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
</FloatingPanel>`,
    },
  },
  {
    id: 'color-field',
    label: 'Color Field',
    title: 'Color Field',
    code: `const [accentColor, setAccentColor] = useState("#d14d41")

<ColorField
  label="Accent"
  value={accentColor}
  onChange={(next) => setAccentColor(next)}
  defaultAlpha={220}
  colorA={flexoki.red["600"]}
  colorB={flexoki.red["100"]}
  borderStyle="a"
  fontSize={12}
/>

<ColorField
  label="Accent (Popup)"
  value={accentColor}
  onChange={(next) => setAccentColor(next)}
  pickerDisplay="popup"
  colorA={flexoki.red["600"]}
  colorB={flexoki.red["100"]}
  borderStyle="a"
  fontSize={12}
/>`,
  },
  {
    id: 'floating-panel',
    label: 'Floating Panel',
    title: 'Floating Panel',
    code: `const InspectorContent = () => {
  return (
    <>
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
    showOpacityControl
    defaultBodyOpacity={0.85}
    bodyBlur={0}
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
