import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    lib: {
      entry: {
        lfoslider: path.resolve(__dirname, "src/library.ts"),
        core: path.resolve(__dirname, "src/core.ts"),
        audio: path.resolve(__dirname, "src/audio.ts"),
      },
      name: "UIBits",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
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
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  assetsInclude: ['**/*.tif'],
});
