import { describe, expect, it } from "vitest";
import { percent, resultsChart } from "../src/flow/results-chart.js";
import { results } from "./stub-api.js";

const two = results({
  voters: 4,
  confirmedVoters: 2,
  choices: [
    {
      index: 0,
      label: "Yes",
      count: 1,
      share: 25,
      confirmedCount: 0,
      confirmedShare: 0,
    },
    {
      index: 1,
      label: "No",
      count: 3,
      share: 75,
      confirmedCount: 2,
      confirmedShare: 100,
    },
  ],
});

describe("results as chart data (#453)", () => {
  it("plots shares against 100 and names both denominators", () => {
    const chart = resultsChart(two, [1]);
    expect(chart.max).toBe(100);
    expect(chart.highlightNote).toBe("yours");
    expect(chart.series.map((one) => one.label)).toEqual([
      "All votes (4)",
      "Confirmed by email (2)",
    ]);
    expect(chart.data.map((one) => one.values["all"]?.value)).toEqual([25, 75]);
    expect(chart.data[1]).toMatchObject({
      label: "No",
      highlighted: true,
      values: {
        all: { value: 75, text: "3 votes · 75%" },
        confirmed: { value: 100, text: "2 confirmed · 100%" },
      },
    });
    expect(chart.data[0]?.values["all"]?.text).toBe("1 vote · 25%");
  });

  it("leaves out the confirmed series when nobody confirmed", () => {
    const chart = resultsChart({ ...two, confirmedVoters: 0 }, []);
    expect(chart.series).toHaveLength(1);
    expect(chart.data[0]?.values["confirmed"]).toBeUndefined();
    expect(chart.data.every((one) => !one.highlighted)).toBe(true);
  });

  it("formats a share as a percentage", () => {
    expect(percent(70)).toBe("70%");
  });
});
