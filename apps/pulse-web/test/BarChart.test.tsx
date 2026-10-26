// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
  BarChart,
  COLUMN_LIMIT,
  type BarChartDatum,
} from "../src/components/BarChart.js";

afterEach(cleanup);

const datum = (at: number, highlighted = false): BarChartDatum => ({
  id: String(at),
  label: `Answer ${at}`,
  highlighted,
  values: {
    a: { value: at * 10, text: `${at} votes` },
    b: { value: at * 5, text: `${at} confirmed` },
  },
});

const draw = (count: number, series: 1 | 2 = 2) =>
  render(
    <BarChart
      caption="How people answered"
      series={
        series === 2
          ? [
              { key: "a", label: "All" },
              { key: "b", label: "Confirmed" },
            ]
          : [{ key: "a", label: "All" }]
      }
      data={Array.from({ length: count }, (_, at) => datum(at + 1, at === 0))}
      max={100}
      formatValue={(value) => `${value}%`}
      highlightNote="yours"
    />,
  );

it("names the figure, hides the drawing and reads out every figure as a table", () => {
  draw(3);
  const figure = screen.getByRole("figure", { name: "How people answered" });
  expect(
    figure.querySelector(".bar-chart__plot")?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(
    within(figure)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual(["How people answered", "All", "Confirmed"]);
  const row = within(figure).getByRole("rowheader", {
    name: "Answer 2",
  }).parentElement!;
  expect(
    [...row.querySelectorAll("td")].map((cell) => cell.textContent),
  ).toEqual(["2 votes", "2 confirmed"]);
});

it("shows a legend only for two series", () => {
  draw(2, 2);
  expect(document.querySelector(".bar-chart__legend")?.textContent).toBe(
    "AllConfirmed",
  );
  cleanup();
  draw(2, 1);
  expect(document.querySelector(".bar-chart__legend")).toBeNull();
});

const labelled = (labels: readonly string[]) =>
  render(
    <BarChart
      caption="Answers"
      series={[{ key: "a", label: "All" }]}
      data={labels.map((label, at) => ({
        id: String(at),
        label,
        values: { a: { value: 10, text: "1 vote" } },
      }))}
      max={100}
      formatValue={(value) => `${value}%`}
    />,
  );
const columnsDrawn = () =>
  document.querySelector(".recharts-xAxis-tick-labels .bar-chart__tick") !==
  null;
const rowsDrawn = () =>
  document.querySelector(".recharts-yAxis-tick-labels .bar-chart__tick") !==
  null;

it("draws columns when labels fit, and horizontal bars past the limit or for long words", () => {
  // jsdom has no layout, so the chart is drawn at its 320px fallback width.
  labelled(["Yes", "No", "Maybe"]);
  expect(columnsDrawn()).toBe(true);
  cleanup();
  labelled(Array.from({ length: COLUMN_LIMIT + 1 }, (_, at) => `A${at}`));
  expect(rowsDrawn()).toBe(true);
  cleanup();
  labelled(["Yes", "Conversationally", "No"]);
  expect(rowsDrawn()).toBe(true);
});

it("draws a highlighted label in bold and names why in the table", () => {
  draw(3);
  const bold = document.querySelectorAll(".bar-chart__tick--bold");
  expect([...bold].map((one) => one.textContent)).toEqual(["Answer 1"]);
  expect(
    screen.getByRole("rowheader", { name: "Answer 1 (yours)" }),
  ).toBeTruthy();
});
