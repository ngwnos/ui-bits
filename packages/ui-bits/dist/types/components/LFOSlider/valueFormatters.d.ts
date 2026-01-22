export type DisplayValueFormatReason = 'value' | 'drawer';
export interface DisplayValueFormatContext {
    reason: DisplayValueFormatReason;
    rawValueText: string;
}
export type FormatDisplayValueFn = (value: number, context: DisplayValueFormatContext) => string;
export type ParseDisplayValueFn = (text: string) => number | null | undefined;
export type DisplayValueFormatterPreset = 'dayOfYear' | 'time';
export interface DayOfYearFormatterOptions {
    baseYear?: number;
    zeroOffset?: number;
    locale?: string;
}
export interface DisplayFormatterPresetOptions {
    dayOfYear?: DayOfYearFormatterOptions;
    time?: TimeFormatterOptions;
}
export interface DisplayFormatterResult {
    format: FormatDisplayValueFn;
    parse: ParseDisplayValueFn;
    formatLabel: (value: number) => string;
}
export interface TimeFormatterOptions {
    zeroOffset?: number;
}
export declare function createDayOfYearFormatter({ min, max, options, }: {
    min: number;
    max: number;
    options?: DayOfYearFormatterOptions;
}): DisplayFormatterResult;
export declare function createTimeFormatter({ min, max, options, }: {
    min: number;
    max: number;
    options?: TimeFormatterOptions;
}): DisplayFormatterResult;
