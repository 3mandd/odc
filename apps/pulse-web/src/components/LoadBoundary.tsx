import { Component, type ReactNode } from "react";

/**
 * Shows `fallback` instead of `children` once rendering them throws, so a part
 * of the page that failed (typically a `React.lazy` chunk that did not
 * download: a dropped connection, or a deploy that renamed the chunk) never
 * takes the whole app down with it. Pair it with `<Suspense>` around lazy
 * components; give it a fallback that still does the job, not an apology.
 *
 * It does not retry: once failed, the fallback stays until the boundary
 * remounts (React.lazy keeps the failed import anyway).
 */
export class LoadBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
