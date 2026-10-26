// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Suspense, lazy } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { LoadBoundary } from "../src/components/LoadBoundary.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("shows its fallback when a lazy child's code fails to load", async () => {
  // React logs the caught error; keep the test output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
  const Broken = lazy(() => Promise.reject(new Error("chunk did not load")));
  render(
    <div>
      <p>Still here</p>
      <LoadBoundary fallback={<p>Plain rows</p>}>
        <Suspense fallback={<p>Loading…</p>}>
          <Broken />
        </Suspense>
      </LoadBoundary>
    </div>,
  );
  expect(await screen.findByText("Plain rows")).toBeTruthy();
  expect(screen.getByText("Still here")).toBeTruthy();
});

it("renders its children when nothing fails", () => {
  render(
    <LoadBoundary fallback={<p>Plain rows</p>}>
      <p>Chart</p>
    </LoadBoundary>,
  );
  expect(screen.getByText("Chart")).toBeTruthy();
  expect(screen.queryByText("Plain rows")).toBeNull();
});
