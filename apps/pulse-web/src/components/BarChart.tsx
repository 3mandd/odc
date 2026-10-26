import { useId } from "react";
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
import {
  BAR_GAP,
  BAR_RADIUS,
  MAX_BAR,
  MAX_LINES,
  ROW_LABEL_GAP,
  TOP_ROOM,
  VALUE_AXIS,
  chartLayout,
} from "../flow/bar-chart-layout.js";
import { useElementWidth } from "../hooks/use-element-width.js";
import "./BarChart.css";

/**
 * A bar chart on a white card: the one place the app draws a chart, and the
 * one file that imports the charting library (Recharts, ADR-0045). It knows
 * nothing about polls; callers map their data to `BarChartDatum`s (see
 * `flow/results-chart.ts`). Sizing rules live in `flow/bar-chart-layout.ts`.
 *
 * Load it lazily (`React.lazy`) where it is not needed on first paint:
 * Recharts is most of its weight.
 *
 * Identity never rests on colour alone: the second series is striped as well
 * as coloured, a legend names both, and a highlighted datum's label says why it
 * is bold. The drawing is hidden from assistive technology; a visually hidden
 * table carries the same figures, each `text` in full.
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
  /** Drawn in bold, with `highlightNote` after its label. */
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
  const stripeId = useId();
  const fullLabel = (datum: BarChartDatum) =>
    datum.highlighted && highlightNote
      ? `${datum.label} (${highlightNote})`
      : datum.label;
  const layout = chartLayout({
    width,
    labels: data.map(fullLabel),
    valueLabels: data.flatMap((datum) =>
      series.map((one) => formatValue(datum.values[one.key]?.value ?? 0)),
    ),
    seriesCount: series.length,
  });
  const columns = layout.orientation === "columns";
  const rows = data.map((datum) => ({
    id: datum.id,
    label: fullLabel(datum),
    ...Object.fromEntries(
      series.map((one) => [one.key, datum.values[one.key]?.value ?? 0]),
    ),
  }));
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const isHighlighted = (index: number) => data[index]?.highlighted === true;
  const tick = (props: TickProps) => (
    <WrappedTick
      {...props}
      width={columns ? layout.band : layout.axis - ROW_LABEL_GAP}
      anchor={columns ? "middle" : "end"}
      bold={isHighlighted(props.index ?? props.payload.index)}
    />
  );
  const valueAxis = {
    domain: [0, max],
    ticks,
    tickFormatter: formatValue,
    axisLine: false,
    tickLine: false,
  } as const;

  return (
    <figure className="bar-chart" aria-labelledby={captionId}>
      <figcaption id={captionId} className="bar-chart__caption">
        {caption}
      </figcaption>
      {series.length > 1 ? (
        <ul className="bar-chart__legend" aria-hidden="true">
          {series.map((one, at) => (
            <li key={one.key}>
              <Swatch slot={at + 1} />
              {one.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div ref={ref} className="bar-chart__plot" aria-hidden="true">
        <RechartsBarChart
          width={width}
          height={layout.height}
          data={rows}
          layout={columns ? "horizontal" : "vertical"}
          margin={{ top: TOP_ROOM, right: layout.right, bottom: 0, left: 0 }}
          barGap={BAR_GAP}
          accessibilityLayer={false}
        >
          <defs>
            {/* The second series' stripes, so it differs by more than hue. */}
            <pattern
              id={stripeId}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect className="bar-chart__stripe-ground" width="6" height="6" />
              {/* Centred in the tile, so the stripe is not half-clipped. */}
              <line className="bar-chart__stripe" x1="3" y1="0" x2="3" y2="6" />
            </pattern>
          </defs>
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
                height={layout.axis}
                tickLine={false}
                tick={tick}
              />
              <YAxis {...valueAxis} width={VALUE_AXIS} />
            </>
          ) : (
            <>
              <XAxis type="number" {...valueAxis} />
              <YAxis
                type="category"
                dataKey="label"
                interval={0}
                width={layout.axis}
                tickLine={false}
                tick={tick}
              />
            </>
          )}
          <Tooltip
            cursor={{ className: "bar-chart__cursor" }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const id = (payload?.[0]?.payload as { id?: string } | undefined)
                ?.id;
              const datum = data.find((one) => one.id === id);
              return active && datum ? (
                <ChartTooltip
                  label={fullLabel(datum)}
                  datum={datum}
                  series={series}
                />
              ) : null;
            }}
          />
          {series.map((one, at) => (
            <Bar
              key={one.key}
              dataKey={one.key}
              name={one.label}
              className={`bar-chart__series bar-chart__series--${at + 1}`}
              {...(at === 1 ? { fill: `url(#${stripeId})` } : {})}
              maxBarSize={MAX_BAR}
              radius={
                columns
                  ? [BAR_RADIUS, BAR_RADIUS, 0, 0]
                  : [0, BAR_RADIUS, BAR_RADIUS, 0]
              }
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
      <table className="visually-hidden">
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

function Swatch({ slot }: { slot: number }) {
  return <span className={`bar-chart__swatch bar-chart__swatch--${slot}`} />;
}

function ChartTooltip({
  label,
  datum,
  series,
}: {
  label: string;
  datum: BarChartDatum;
  series: readonly BarChartSeries[];
}) {
  return (
    <div className="bar-chart__tooltip">
      <p className="bar-chart__tooltip-label">{label}</p>
      {series.map((one, at) => (
        <p key={one.key}>
          <Swatch slot={at + 1} />
          {one.label}: {datum.values[one.key]?.text ?? ""}
        </p>
      ))}
    </div>
  );
}
