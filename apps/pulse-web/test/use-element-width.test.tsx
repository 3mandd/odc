// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useElementWidth } from "../src/hooks/use-element-width.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

let seen = 0;
function Probe() {
  const { ref, width } = useElementWidth<HTMLDivElement>(320);
  seen = width;
  return <div ref={ref} />;
}

it("uses the fallback where ResizeObserver does not exist", () => {
  vi.stubGlobal("ResizeObserver", undefined);
  render(<Probe />);
  expect(seen).toBe(320);
});

it("measures on mount and again on every resize, and stops when unmounted", () => {
  let width = 375;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ width }) as DOMRect,
  );
  let notify = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const { unmount } = render(<Probe />);
  expect(seen).toBe(375);
  width = 700;
  act(() => notify());
  expect(seen).toBe(700);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  vi.restoreAllMocks();
});
