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
/** Space between a category's bars (Recharts `barGap`). */
export const BAR_GAP = 2;
/** Recharts' default space between categories, as a share of each band. */
const CATEGORY_GAP = 0.1;
/** Room right of the columns' plot. */
const COLUMN_RIGHT = 4;
/** Padding kept between a wrapped label and its column's edges. */
const LABEL_INSET = 4;
/** Rows: label column as a share of the width, its cap, and its gap to the bars. */
const ROW_LABEL_SHARE = 0.45;
const ROW_LABEL_MAX = 200;
export const ROW_LABEL_GAP = 8;
/** Rows: height per bar in a row, padding round a row's bars or its label. */
const ROW_PER_BAR = 14;
const ROW_BAR_PAD = 12;
const ROW_LABEL_PAD = 10;
/** Rows: room for the value axis under the bars. */
const ROW_AXIS = 40;
/** Space between a value label and the end of its bar or the edge. */
const VALUE_PAD = 8;

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
  const band = (width - VALUE_AXIS - COLUMN_RIGHT) / count;
  const columns =
    labels.length <= COLUMN_LIMIT &&
    longestWord(labels) * CHAR <= band - LABEL_INSET &&
    valueWidth + VALUE_PAD <= valueSpacing(band, seriesCount);

  if (columns) {
    const lines = mostLines(labels, band - LABEL_INSET);
    const axis = lines * LINE + VALUE_PAD;
    return {
      orientation: "columns",
      band: band - LABEL_INSET,
      axis,
      height: PLOT_HEIGHT + axis,
      right: COLUMN_RIGHT,
    };
  }
  const axis = Math.min(ROW_LABEL_MAX, Math.floor(width * ROW_LABEL_SHARE));
  const lines = mostLines(labels, axis - ROW_LABEL_GAP);
  const row = Math.max(
    seriesCount * ROW_PER_BAR + ROW_BAR_PAD,
    lines * LINE + ROW_LABEL_PAD,
  );
  return {
    orientation: "rows",
    axis,
    height: count * row + ROW_AXIS,
    right: Math.ceil(valueWidth) + VALUE_PAD,
  };
}

/**
 * Distance between the centres of neighbouring value labels above columns, as
 * Recharts places the bars: one series sits one per band; several sit side by
 * side within a band, each `barWidth` wide and `BAR_GAP` apart, where
 * `barWidth` is the band's share less the gaps, capped at `MAX_BAR`.
 */
export function valueSpacing(band: number, seriesCount: number): number {
  if (seriesCount <= 1) return band;
  const inner = band * (1 - CATEGORY_GAP * 2) - BAR_GAP * (seriesCount - 1);
  const barWidth = Math.min(inner / seriesCount, MAX_BAR);
  return barWidth + BAR_GAP;
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
