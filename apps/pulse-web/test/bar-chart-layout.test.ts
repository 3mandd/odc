import { describe, expect, it } from "vitest";
import {
  BAR_GAP,
  COLUMN_LIMIT,
  MAX_BAR,
  MAX_LINES,
  chartLayout,
  valueSpacing,
  wrapLines,
} from "../src/flow/bar-chart-layout.js";

const shortLabels = (count: number) =>
  Array.from({ length: count }, (_, at) => `A${at}`);

describe("wrapping an axis label", () => {
  it("wraps on whole words, as Recharts does, not on character count", () => {
    // 20 characters at 10 per line would be 2; by words it is 3.
    expect(wrapLines("Library hours longer", 75)).toBe(3);
    expect(wrapLines("Yes", 75)).toBe(1);
    expect(wrapLines("", 75)).toBe(1);
  });

  it("gives a word too wide for a line a line to itself", () => {
    expect(wrapLines("a Conversationally b", 60)).toBe(3);
  });
});

describe("choosing columns or rows", () => {
  it("uses columns when labels and value labels fit, at phone and desktop widths", () => {
    for (const width of [280, 375, 700]) {
      const layout = chartLayout({
        width,
        labels: ["Yes", "No", "Maybe"],
        valueLabels: ["40%", "35%", "25%"],
        seriesCount: 1,
      });
      expect(layout.orientation).toBe("columns");
    }
  });

  it("turns to rows when two series' value labels would touch, at any width", () => {
    // Recharts caps paired bars at MAX_BAR and sets them BAR_GAP apart, so
    // their labels' centres stay 26px apart however wide the column is.
    const twoSeries = (width: number, valueLabels: string[]) =>
      chartLayout({
        width,
        labels: ["Yes", "No", "Maybe"],
        valueLabels,
        seriesCount: 2,
      }).orientation;
    for (const width of [280, 375, 700, 1200]) {
      expect(twoSeries(width, ["42.9%", "100%"])).toBe("rows");
    }
    // Labels narrow enough for the gap still get columns.
    expect(twoSeries(700, ["5%", "9%"])).toBe("columns");
  });

  it("spaces paired value labels as Recharts places the bars", () => {
    expect(valueSpacing(110, 1)).toBe(110);
    expect(valueSpacing(110, 2)).toBe(MAX_BAR + BAR_GAP);
    // A narrow band: the bars share it, less the category and bar gaps.
    expect(valueSpacing(40, 2)).toBeCloseTo((40 * 0.8 - BAR_GAP) / 2 + BAR_GAP);
  });

  it("turns to rows past the column limit or for a word wider than its column", () => {
    expect(
      chartLayout({
        width: 700,
        labels: shortLabels(COLUMN_LIMIT + 1),
        valueLabels: ["5%"],
        seriesCount: 1,
      }).orientation,
    ).toBe("rows");
    expect(
      chartLayout({
        width: 280,
        labels: ["Yes", "Conversationally", "No"],
        valueLabels: ["5%"],
        seriesCount: 1,
      }).orientation,
    ).toBe("rows");
  });

  it("makes room under columns for the most lines a label wraps to, up to the cap", () => {
    const one = chartLayout({
      width: 375,
      labels: ["Yes", "No"],
      valueLabels: ["5%"],
      seriesCount: 1,
    });
    const three = chartLayout({
      width: 375,
      labels: ["A fairly long answer label that wraps a lot", "No"],
      valueLabels: ["5%"],
      seriesCount: 1,
    });
    expect(one.orientation).toBe("columns");
    expect(three.orientation).toBe("columns");
    if (one.orientation === "columns" && three.orientation === "columns") {
      expect(three.axis - one.axis).toBe((MAX_LINES - 1) * 16);
    }
  });

  it("makes every row tall enough for its longest label and leaves room for values", () => {
    const layout = chartLayout({
      width: 280,
      labels: [...shortLabels(COLUMN_LIMIT), "Question with discussion below"],
      valueLabels: ["100%"],
      seriesCount: 1,
    });
    expect(layout.orientation).toBe("rows");
    // 7 rows of 3 label lines (16px each) plus padding, and the axis.
    expect(layout.height).toBe(7 * (3 * 16 + 10) + 40);
    expect(layout.right).toBeGreaterThanOrEqual(4 * 7.5);
  });
});
