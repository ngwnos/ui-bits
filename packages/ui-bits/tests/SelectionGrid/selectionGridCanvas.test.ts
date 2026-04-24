import { describe, expect, test } from "bun:test";
import {
  buildRoundedRectPath,
  computeAtlasColumns,
  createAtlasCanvas,
  resolveWorkerUrl,
} from "../../src/components/SelectionGrid/selectionGridCanvas";

describe("SelectionGrid canvas helpers", () => {
  test("keeps atlas columns inside the maximum texture bounds", () => {
    expect(computeAtlasColumns(0, 25, 100)).toBe(1);
    expect(computeAtlasColumns(8, 25, 100)).toBe(2);
    expect(computeAtlasColumns(100, 25, 100)).toBe(4);
    expect(computeAtlasColumns(101, 0, 100)).toBe(2);
  });

  test("resolves worker URLs against an explicit base URL", () => {
    expect(resolveWorkerUrl("tile.png", "https://example.com/docs/page")).toBe("https://example.com/docs/tile.png");
    expect(resolveWorkerUrl("/assets/tile.png", "https://example.com/docs/page")).toBe("https://example.com/assets/tile.png");
    expect(resolveWorkerUrl("https://cdn.example.com/tile.png", "https://example.com/docs/page")).toBe(
      "https://cdn.example.com/tile.png",
    );
    expect(resolveWorkerUrl("tile.png", "not a url")).toBe("tile.png");
  });

  test("does not create a canvas outside the browser", () => {
    expect(createAtlasCanvas(100, 100)).toBeNull();
  });

  test("clamps rounded rectangle radii to half the cell size", () => {
    const calls: Array<[string, ...number[]]> = [];
    const context = {
      beginPath: () => calls.push(["beginPath"]),
      moveTo: (x: number, y: number) => calls.push(["moveTo", x, y]),
      lineTo: (x: number, y: number) => calls.push(["lineTo", x, y]),
      quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => {
        calls.push(["quadraticCurveTo", cpx, cpy, x, y]);
      },
      closePath: () => calls.push(["closePath"]),
    } as CanvasRenderingContext2D;

    buildRoundedRectPath(context, 10, 20, 12, { tl: 99, tr: 99, br: 99, bl: 99 });

    expect(calls[0]).toEqual(["beginPath"]);
    expect(calls[1]).toEqual(["moveTo", 16, 20]);
    expect(calls.at(-1)).toEqual(["closePath"]);
  });
});
