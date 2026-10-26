import { useEffect, useRef, useState } from "react";

/**
 * "Copy link" for one address. It writes the address to the clipboard. Where
 * there is no clipboard (an older browser, or a page the browser does not
 * trust with it), `copy` turns "manual": the caller shows a read-only field on
 * `field`, and the hook selects the address in it for the person to copy
 * themselves, again on every later press.
 */
export function useCopyLink(url: string) {
  const [copy, setCopy] = useState<"idle" | "copied" | "manual">("idle");
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (copy === "manual") field.current?.select();
  }, [copy]);

  function showField() {
    setCopy("manual");
    // Already showing: the state does not change, so the effect will not run.
    field.current?.select();
  }

  function copyLink() {
    // Emptied first, so a second "Copied" is a change the status reads out.
    setCopy("idle");
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      showField();
      return;
    }
    clipboard.writeText(url).then(() => setCopy("copied"), showField);
  }

  const status =
    copy === "copied"
      ? "Copied"
      : copy === "manual"
        ? "Copy the selected link."
        : "";

  return { copy, field, copyLink, status };
}
