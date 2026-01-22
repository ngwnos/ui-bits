export declare function normalizeSelection(a: number, b: number, max: number): [number, number];
export declare function applyReplace(base: string, start: number, end: number, insert: string): {
    next: string;
    pos: number;
};
export declare function isAllowedNumericChar(k: string): boolean;
export declare function countDecimals(n: number): number;
export declare function precisionFrom(min: number, max: number, step: number): number;
export declare function hexToRGBA(hex: string, alpha: number): string;
export declare function extendStep(anchor: number, selStart: number, selEnd: number, dir: -1 | 1, textLen: number): [number, number];
