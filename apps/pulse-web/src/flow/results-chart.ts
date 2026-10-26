import type { Results } from "../api/types.js";
import type { BarChartProps } from "../components/BarChart.js";

/**
 * A poll's results as `BarChart` props (#453): each answer's share of all
 * votes, and, once anyone has confirmed by email, its share of confirmed votes
 * beside it. Shares are plotted against 100, not the largest answer, so a bar
 * reads as the percentage it is labelled with.
 *
 * Nobody confirmed: the count line above the chart already says "0 confirmed
 * by email", so a second series of empty bars would only repeat it.
 */
export function resultsChart(
  results: Results,
  yours: readonly number[],
): Omit<BarChartProps, "formatValue"> {
  const confirmed = results.confirmedVoters > 0;
  const all = { key: "all", label: `All votes (${results.voters})` };
  return {
    caption: "How people answered",
    highlightNote: "yours",
    series: confirmed
      ? [
          all,
          {
            key: "confirmed",
            label: `Confirmed by email (${results.confirmedVoters})`,
          },
        ]
      : [all],
    max: 100,
    data: results.choices.map((choice) => {
      const mine = yours.includes(choice.index);
      return {
        id: String(choice.index),
        label: choice.label,
        highlighted: mine,
        values: {
          all: {
            value: choice.share,
            text: `${votes(choice.count)} · ${choice.share}%`,
          },
          ...(confirmed
            ? {
                confirmed: {
                  value: choice.confirmedShare,
                  text: `${choice.confirmedCount} confirmed · ${choice.confirmedShare}%`,
                },
              }
            : {}),
        },
      };
    }),
  };
}

/** How a share reads on the axis and above a bar. */
export const percent = (value: number) => `${value}%`;

function votes(count: number) {
  return count === 1 ? "1 vote" : `${count} votes`;
}
