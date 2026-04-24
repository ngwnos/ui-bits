import { describe, expect, test } from "bun:test";
import {
  applyReplace,
  extendStep,
  hexToRGBA,
  isAllowedNumericChar,
  normalizeSelection,
  precisionFrom,
} from "../../src/components/LFOSlider/utils";
import {
  createDayOfYearFormatter,
  createTimeFormatter,
} from "../../src/components/LFOSlider/valueFormatters";

describe("LFOSlider utilities", () => {
  test("normalizes and extends text selections", () => {
    expect(normalizeSelection(8, 3, 10)).toEqual([3, 8]);
    expect(normalizeSelection(-4, 14, 10)).toEqual([0, 10]);
    expect(extendStep(2, 2, 5, 1, 8)).toEqual([2, 6]);
    expect(extendStep(2, 5, 2, -1, 8)).toEqual([2, 4]);
  });

  test("replaces text and returns the collapsed caret position", () => {
    expect(applyReplace("12.34", 1, 4, "9")).toEqual({ next: "194", pos: 2 });
  });

  test("accepts only numeric editing characters", () => {
    expect(isAllowedNumericChar("1")).toBe(true);
    expect(isAllowedNumericChar(".")).toBe(true);
    expect(isAllowedNumericChar("-")).toBe(true);
    expect(isAllowedNumericChar("Numpad7")).toBe(true);
    expect(isAllowedNumericChar("ArrowLeft")).toBe(false);
    expect(isAllowedNumericChar("x")).toBe(false);
  });

  test("derives numeric precision from decimal and exponent input", () => {
    expect(precisionFrom(0, 1, 0.001)).toBe(3);
    expect(precisionFrom(0, 1, 1e-5)).toBe(5);
  });

  test("formats hex colors with alpha", () => {
    expect(hexToRGBA("#abc", 0.5)).toBe("rgba(170, 187, 204, 0.5)");
    expect(hexToRGBA("112233", 0.25)).toBe("rgba(17, 34, 51, 0.25)");
    expect(hexToRGBA("not-a-color", 0.75)).toBe("rgba(0,0,0,0.75)");
  });
});

describe("LFOSlider display formatters", () => {
  test("formats and parses day-of-year labels", () => {
    const formatter = createDayOfYearFormatter({
      min: 0,
      max: 365,
      options: { baseYear: 2024, locale: "en-US" },
    });

    expect(formatter.formatLabel(0)).toBe("Jan 01");
    expect(formatter.formatLabel(59)).toBe("Feb 29");
    expect(formatter.parse("Feb 29")).toBe(59);
    expect(formatter.parse("Feb 30")).toBeNull();
    expect(formatter.parse("999")).toBe(365);
  });

  test("formats and parses time labels", () => {
    const formatter = createTimeFormatter({ min: 0, max: 7200 });

    expect(formatter.formatLabel(3661)).toBe("01:01:01");
    expect(formatter.parse("01:02:03")).toBe(3723);
    expect(formatter.parse("24:00:00")).toBeNull();
    expect(formatter.parse("99999")).toBe(7200);
  });
});
