import { useLayoutEffect, useRef, useState } from "react";

/**
 * The rendered width of an element, kept current as it resizes, for drawing
 * that needs a number rather than CSS (an SVG chart). Before the first
 * measurement, and where ResizeObserver does not exist (jsdom), it is
 * `fallback`, so the first render already has a sensible size.
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next = Math.floor(element.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
