import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const componentEntries = [
  "AudioControls",
  "BasicButton",
  "ColorField",
  "ColorFieldPicker",
  "ColorPicker",
  "Dial",
  "Dropdown",
  "FloatingPanel",
  "Folder",
  "IconButton",
  "IconDropdown",
  "KeyValueAccordion",
  "KeyValueRows",
  "LFOSlider",
  "ListRow",
  "ListSurface",
  "LoadingBar",
  "NameInputRow",
  "PresetManager",
  "RadioList",
  "SegmentBar",
  "SelectionGrid",
  "Sequencer",
  "TextInput",
  "VirtualKeyboard",
  "WebGpuStatus",
] as const;

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/library.ts"),
        core: path.resolve(__dirname, "src/core.ts"),
        audio: path.resolve(__dirname, "src/audio.ts"),
        terrain: path.resolve(__dirname, "src/terrain.ts"),
        ...Object.fromEntries(
          componentEntries.map((component) => [
            `components/${component}`,
            path.resolve(__dirname, `src/components/${component}/index.ts`),
          ]),
        ),
      },
      name: "UIBits",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      cssFileName: "ui-bits",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "lucide-react",
        "typegpu",
        "tone",
        "soundfont-player",
      ],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
