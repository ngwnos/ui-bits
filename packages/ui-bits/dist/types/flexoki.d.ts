export type ShadeKey = '50' | '100' | '150' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '850' | '900' | '950';
export type FlexokiRamp = Record<ShadeKey, string>;
export interface FlexokiPalette {
    base: FlexokiRamp;
    red: FlexokiRamp;
    orange: FlexokiRamp;
    yellow: FlexokiRamp;
    green: FlexokiRamp;
    cyan: FlexokiRamp;
    blue: FlexokiRamp;
    purple: FlexokiRamp;
    magenta: FlexokiRamp;
    paper: string;
    black: string;
}
export type FlexokiHue = Exclude<keyof FlexokiPalette, 'paper' | 'black'>;
export declare const flexoki: FlexokiPalette;
export declare const flexokiShades: ShadeKey[];
export type FlexokiShade = (typeof flexokiShades)[number];
