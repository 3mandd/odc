import {
  Bar,
  CartesianGrid,
  LabelList,
  BarChart as RechartsBarChart,
  Text,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "react";
import { useElementWidth } from "../hooks/use-element-width.js";
import "./BarChart.css";

/**
 * A bar chart on a white card: the one place the app draws a chart, and the
 * one file that imports the charting library (Recharts). It knows nothing
 * about polls; callers map their data to `BarChartDatum`s (see
 * `flow/results-chart.ts`).
 *
 * Columns when there are at most `COLUMN_LIMIT` categories and every word of
 * every label fits its column at the current width; otherwise horizontal bars,
 * whose labels get a wide column of their own. So a long list, or long words
 * on a phone, still read. Colours come from the
 * `--chart-*` tokens. The drawing is hidden from assistive technology and a
 * visually hidden table carries the same figures, with each `text` in full.
 */
export interface BarChartSeries {
  /** Key into each datum's `values`. */
  key: string;
  /** Shown in the legend and the table header, e.g. "All votes". */
  label: string;
}

export interface BarChartDatum {
  id: string;
  label: string;
  /** Drawn in bold, and named with `highlightNote` in tooltip and table. */
  highlighted?: boolean;
  /** Per series: the plotted number, and its full wording for tooltip and table. */
  values: Readonly<Record<string, { value: number; text: string }>>;
}

export interface BarChartProps {
  /** Names the figure, e.g. "How people answered". */
  caption: string;
  /** One or two series; the tokens define two colours. */
  series: readonly [BarChartSeries] | readonly [BarChartSeries, BarChartSeries];
  data: readonly BarChartDatum[];
  /** Top of the value axis, e.g. 100 for percentages. */
  max: number;
  /** How a value reads on the axis and above its bar, e.g. "70%". */
  formatValue: (value: number) => string;
  /** Says why a highlighted datum is bold, e.g. "yours": "Park (yours)". */
  highlightNote?: string;
}

/** More categories than this are drawn as horizontal bars. */
export const COLUMN_LIMIT = 6;

export function BarChart({
  caption,
  series,
  data,
  max,
  formatValue,
  highlightNote,
}: BarChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>(320);
  const captionId = useId();
  const columns = fitsColumns(width, data);
  const rows = data.map((datum) => ({
    label: datum.label,
    highlighted: datum.highlighted === true,
    ...Object.fromEntries(
      series.map((one) => [one.key, datum.values[one.key]?.value ?? 0]),
    ),
  }));
  const size = columns
    ? columnLayout(width, data)
    : rowLayout(width, data, series.length);
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const isHighlighted = (index: number) => data[index]?.highlighted === true;
  // The axis has room for the label only; tooltip and table say why it is bold.
  const fullLabel = (datum: BarChartDatum) =>
    datum.highlighted && highlightNote
      ? `${datum.label} (${highlightNote})`
      : datum.label;

  return (
    <figure className="bar-chart" aria-labelledby={captionId}>
      <figcaption id={captionId} className="bar-chart__caption">
        {caption}
      </figcaption>
      {series.length > 1 ? (
        <ul className="bar-chart__legend" aria-hidden="true">
          {series.map((one, at) => (
            <li key={one.key}>
              <span
                className={`bar-chart__swatch bar-chart__swatch--${at + 1}`}
              />
              {one.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div ref={ref} className="bar-chart__plot" aria-hidden="true">
        <RechartsBarChart
          width={width}
          height={size.height}
          data={rows}
          layout={columns ? "horizontal" : "vertical"}
          margin={{ top: 20, right: columns ? 4 : 40, bottom: 0, left: 0 }}
          barGap={2}
          accessibilityLayer={false}
        >
          <CartesianGrid
            className="bar-chart__grid"
            vertical={!columns}
            horizontal={columns}
          />
          {columns ? (
            <>
              <XAxis
                dataKey="label"
                interval={0}
                height={size.axis}
                tickLine={false}
                tick={(props: TickProps) => (
                  <WrappedTick
                    {...props}
                    width={size.band}
                    anchor="middle"
                    bold={isHighlighted(props.index ?? props.payload.index)}
                  />
                )}
              />
              <YAxis
                domain={[0, max]}
                ticks={ticks}
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
                width={40}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={ticks}
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                interval={0}
                width={size.axis}
                tickLine={false}
                tick={(props: TickProps) => (
                  <WrappedTick
                    {...props}
                    width={size.axis - 8}
                    anchor="end"
                    bold={isHighlighted(props.index ?? props.payload.index)}
                  />
                )}
              />
            </>
          )}
          <Tooltip
            cursor={{ className: "bar-chart__cursor" }}
            isAnimationActive={false}
            content={({ active, label }) =>
              active ? (
                <ChartTooltip
                  datum={data.find((one) => one.label === label)}
                  series={series}
                  fullLabel={fullLabel}
                />
              ) : null
            }
          />
          {series.map((one, at) => (
            <Bar
              key={one.key}
              dataKey={one.key}
              name={one.label}
              className={`bar-chart__series bar-chart__series--${at + 1}`}
              maxBarSize={24}
              radius={columns ? [4, 4, 0, 0] : [0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey={one.key}
                position={columns ? "top" : "right"}
                className="bar-chart__value"
                formatter={(value) =>
                  typeof value === "number" ? formatValue(value) : ""
                }
              />
            </Bar>
          ))}
        </RechartsBarChart>
      </div>
      <table className="bar-chart__table">
        <thead>
          <tr>
            <th scope="col">{caption}</th>
            {series.map((one) => (
              <th key={one.key} scope="col">
                {one.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.id}>
              <th scope="row">{fullLabel(datum)}</th>
              {series.map((one) => (
                <td key={one.key}>{datum.values[one.key]?.text ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  index?: number;
  payload: { value: string; index: number };
}

/** An axis label that wraps onto more lines instead of overlapping its neighbour. */
function WrappedTick({
  x,
  y,
  payload,
  width,
  anchor,
  bold,
}: TickProps & { width: number; anchor: "middle" | "end"; bold: boolean }) {
  return (
    <Text
      x={Number(x)}
      y={Number(y)}
      dy={anchor === "middle" ? 4 : 0}
      width={width}
      textAnchor={anchor}
      verticalAnchor={anchor === "middle" ? "start" : "middle"}
      maxLines={MAX_LINES}
      // Recharts measures words to wrap them; give it the drawn font, or it
      // measures at 16px and cuts words that fit.
      style={{ fontSize: "var(--t-small)", fontWeight: bold ? 700 : 400 }}
      className={
        bold ? "bar-chart__tick bar-chart__tick--bold" : "bar-chart__tick"
      }
    >
      {payload.value}
    </Text>
  );
}

function ChartTooltip({
  datum,
  series,
  fullLabel,
}: {
  datum: BarChartDatum | undefined;
  series: readonly BarChartSeries[];
  fullLabel: (datum: BarChartDatum) => string;
}) {
  if (!datum) return null;
  return (
    <div className="bar-chart__tooltip">
      <p className="bar-chart__tooltip-label">{fullLabel(datum)}</p>
      {series.map((one, at) => (
        <p key={one.key}>
          <span className={`bar-chart__swatch bar-chart__swatch--${at + 1}`} />
          {one.label}: {datum.values[one.key]?.text ?? ""}
        </p>
      ))}
    </div>
  );
}

/**
 * Line height of a wrapped axis label, the average width of one of its
 * characters (bold, so a little wide), and the most lines it may take before
 * an ellipsis; the tooltip and table always give it in full.
 */
const LINE = 16;
const CHAR = 7.5;
const MAX_LINES = 3;

/** Width of each column: the plot less the value axis, shared out. */
function bandWidth(width: number, count: number) {
  return (width - 44) / Math.max(1, count) - 4;
}

/** Whether labels can sit under columns without cutting a word. */
function fitsColumns(width: number, data: readonly BarChartDatum[]) {
  if (data.length > COLUMN_LIMIT) return false;
  const band = bandWidth(width, data.length);
  const longest = Math.max(
    0,
    ...data.flatMap((one) => one.label.split(/\s+/).map((word) => word.length)),
  );
  return longest * CHAR <= band;
}

/** Columns: plot height, room under it for labels, and each column's width. */
function columnLayout(width: number, data: readonly BarChartDatum[]) {
  const band = Math.max(40, bandWidth(width, data.length));
  const lines = labelLines(band, data);
  const axis = lines * LINE + 8;
  return { band, axis, height: 180 + axis };
}

/**
 * Rows: a label column, and a row tall enough for its longest label's lines
 * (rows share one height) or its bars, whichever is taller.
 */
function rowLayout(
  width: number,
  data: readonly BarChartDatum[],
  seriesCount: number,
) {
  const axis = Math.min(200, Math.floor(width * 0.45));
  const lines = labelLines(axis - 8, data);
  const row = Math.max(seriesCount * 14 + 12, lines * LINE + 10);
  // Rows have no column band; the label column is `axis` wide.
  return { band: 0, axis, height: data.length * row + 40 };
}

/** How many lines the longest label takes at `width`, up to `MAX_LINES`. */
function labelLines(width: number, data: readonly BarChartDatum[]) {
  const perLine = Math.max(4, Math.floor(width / CHAR));
  return Math.min(
    MAX_LINES,
    Math.max(1, ...data.map((one) => Math.ceil(one.label.length / perLine))),
  );
}
