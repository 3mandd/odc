/**
 * Sizing for `BarChart`, as pure arithmetic so it can be tested at any width.
 *
 * Recharts draws SVG and needs numbers, not CSS. These estimates assume the
 * chart's text is drawn at `--t-small` (13px): `CHAR` is a generous average
 * character width (bold included) and `LINE` a line height. Change that token
 * and these two constants together.
 */
export const LINE = 16;
export const CHAR = 7.5;
/** Most lines an axis label may take before Recharts ends it with "…". */
export const MAX_LINES = 3;
/** More categories than this always use horizontal bars. */
export const COLUMN_LIMIT = 6;
/** Width of the value axis beside columns. */
export const VALUE_AXIS = 40;
/** Height of the plot area above the column labels. */
export const PLOT_HEIGHT = 180;
/** Room above the tallest column for its value label. */
export const TOP_ROOM = 20;
/** Widest a bar may draw, and its rounded end. */
export const MAX_BAR = 24;
export const BAR_RADIUS = 4;
/** Recharts' default space between categories, as a share of each band. */
const CATEGORY_GAP = 0.1;

export type ChartLayout =
  | {
      orientation: "columns";
      /** Width each category gets, for wrapping its label. */
      band: number;
      /** Height of the label area under the columns. */
      axis: number;
      height: number;
      /** Space right of the plot. */
      right: number;
    }
  | {
      orientation: "rows";
      /** Width of the label column. */
      axis: number;
      height: number;
      /** Space right of the longest bar for its value label. */
      right: number;
    };

/**
 * Columns when there are few enough categories, every word of every label
 * fits its column, and the value labels above neighbouring bars cannot touch;
 * horizontal bars otherwise, whose labels get a column of their own.
 */
export function chartLayout({
  width,
  labels,
  valueLabels,
  seriesCount,
}: {
  width: number;
  labels: readonly string[];
  /** Every value label the chart will draw, e.g. "42.9%". */
  valueLabels: readonly string[];
  seriesCount: number;
}): ChartLayout {
  const count = Math.max(1, labels.length);
  const valueWidth =
    Math.max(0, ...valueLabels.map((one) => one.length)) * CHAR;
  const band = (width - VALUE_AXIS - 4) / count;
  const pitch = (band * (1 - CATEGORY_GAP * 2)) / Math.max(1, seriesCount);
  const columns =
    labels.length <= COLUMN_LIMIT &&
    longestWord(labels) * CHAR <= band - 4 &&
    valueWidth <= pitch;

  if (columns) {
    const lines = mostLines(labels, band - 4);
    const axis = lines * LINE + 8;
    return {
      orientation: "columns",
      band: band - 4,
      axis,
      height: PLOT_HEIGHT + axis,
      right: 4,
    };
  }
  const axis = Math.min(200, Math.floor(width * 0.45));
  const lines = mostLines(labels, axis - 8);
  const row = Math.max(seriesCount * 14 + 12, lines * LINE + 10);
  return {
    orientation: "rows",
    axis,
    height: count * row + 40,
    right: Math.ceil(valueWidth) + 8,
  };
}

/**
 * Lines `text` takes when wrapped on spaces at `width`, as Recharts' `<Text>`
 * wraps it: whole words, a word too wide for a line keeping a line to itself.
 */
export function wrapLines(text: string, width: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  let lines = 1;
  let used = 0;
  for (const word of words) {
    const size = word.length * CHAR;
    const next = used === 0 ? size : used + CHAR + size;
    if (used > 0 && next > width) {
      lines += 1;
      used = size;
    } else {
      used = next;
    }
  }
  return lines;
}

function mostLines(labels: readonly string[], width: number): number {
  return Math.min(
    MAX_LINES,
    Math.max(1, ...labels.map((label) => wrapLines(label, width))),
  );
}

function longestWord(labels: readonly string[]): number {
  return Math.max(
    0,
    ...labels.flatMap((label) => label.split(/\s+/).map((word) => word.length)),
  );
}
