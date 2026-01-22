export type GradientStop = {
    color: string;
    stop: number;
};
export type GradientDefinition = {
    name: string;
    stops: GradientStop[];
};
export declare function createGradientCss(stops: GradientStop[], invert?: boolean): string;
export declare function buildPalette(stops: GradientStop[], invert?: boolean): {
    data: Uint8ClampedArray;
    css: string[];
};
export declare const MATPLOTLIB_GRADIENTS: GradientDefinition[];
