import { useCopyLink } from "../hooks/use-copy-link.js";
import "./CopyLink.css";

/**
 * "Copy link" for one question's page, so anyone can share a vote after its
 * posting banner is gone (#471). Where there is no clipboard, the address
 * appears in a read-only field, selected, for the person to copy themselves.
 */
export function CopyLink({
  url,
  question,
}: {
  /** The question's absolute address. */
  url: string;
  question: string;
}) {
  const { copy, field, copyLink, status } = useCopyLink(url);
  return (
    <div className="copy-link">
      <button
        type="button"
        aria-label={`Copy link to ${question}`}
        onClick={copyLink}
      >
        Copy link
      </button>
      {copy === "manual" ? (
        <input
          ref={field}
          readOnly
          value={url}
          aria-label={`Link to ${question}`}
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}
      {/* Read out politely; a plain live region, so the card's own status
          stays the page's one role="status". */}
      <span aria-live="polite">{status}</span>
    </div>
  );
}
