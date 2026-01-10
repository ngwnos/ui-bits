import { flexoki, type FlexokiHue } from "./flexoki";

export type SliderColorCombo = {
  key: string;
  colorA: string;
  colorB: string;
};

const flexokiHueOrder: FlexokiHue[] = [
  "base",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "magenta",
];

export const sliderColorCombos: SliderColorCombo[] = flexokiHueOrder.map((hue) => ({
  key: `${hue}-600-150`,
  colorA: flexoki[hue]["600"],
  colorB: flexoki[hue]["150"],
}));
