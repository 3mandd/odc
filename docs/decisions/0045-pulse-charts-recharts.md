# ADR-0045: Pulse draws charts with Recharts, behind one component

- **Status:** accepted
- **Date:** 2026-10-26
- **Phase:** 0 (pulse, charter-exempt)

## Context

#453 asks for poll results as a compact chart below the question. A first
version drew the bars with hand-written CSS. The operator reviewed it on
2026-10-26, found it poor, and asked for a standard, commonly used
visualization package on a white background, with components reusable and
discoverable for later work. Two candidates were offered: Recharts (React, SVG)
and Chart.js (canvas, via react-chartjs-2). The operator chose Recharts.

## Decision

- `apps/pulse-web` depends on `recharts` (pinned exactly, 3.10.1).
- `src/components/BarChart.tsx` is the only file that imports it. It takes plain
  data, not poll types; domain data is mapped in `flow/` (for example
  `flow/results-chart.ts`). Sizing rules are pure functions in
  `flow/bar-chart-layout.ts`. Colours come from the `--chart-*` tokens.
- `BarChart` is loaded with `React.lazy` where it is not needed on first paint,
  so Recharts stays out of the first bundle.
- `react-is` is a direct, exact dependency kept at the installed React version.
  Recharts uses it to recognise its child elements; an older `react-is` from
  another package resolved first and does not recognise React 19 elements,
  so Recharts would silently draw nothing. **Bump `react-is` together with
  `react`.**
- The chart is hidden from assistive technology and a visually hidden table
  carries the same figures.

## Consequences

- The first-load bundle is unchanged within a few kB (92 → 93 kB gzipped); the
  chart chunk is about 107 kB gzipped and loads when results first show.
- SVG keeps bars and labels in the DOM, so component tests can check them,
  unlike a canvas.
- A future chart (a different shape, more series) goes beside `BarChart` in
  `components/` and also imports Recharts there; nothing else imports it.
- More than two series need more `--chart-series-*` tokens, taken in order from
  the validated palette in the `dataviz` skill, and the validator re-run.

### Documents reconciled

- `.claude/skills/odc-ui/SKILL.md` lists `BarChart` and says where charts live
  (this PR).
- ADR-0044 (results placement) is unchanged; this ADR covers only how results
  are drawn in the compact banner.

## Charter check

None: Pulse is charter-exempt (`apps/pulse/CLAUDE.md`).
