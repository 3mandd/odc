// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CopyLink } from "../src/components/CopyLink.js";

const URL_ = "https://pulse.test/?poll=a%2Fb";

function useClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  useClipboard(undefined);
});

it("copies the question's address and says so", async () => {
  const writeText = vi.fn(() => Promise.resolve());
  useClipboard({ writeText });
  render(<CopyLink url={URL_} question="Where next?" />);
  await userEvent.click(
    screen.getByRole("button", { name: "Copy link to Where next?" }),
  );
  expect(writeText).toHaveBeenCalledWith(URL_);
  expect((await screen.findByText("Copied")).getAttribute("aria-live")).toBe(
    "polite",
  );
});

it("selects the address in a read-only field, again on every press, with no clipboard", async () => {
  render(<CopyLink url={URL_} question="Where next?" />);
  const button = screen.getByRole("button", {
    name: "Copy link to Where next?",
  });
  await userEvent.click(button);
  const field = screen.getByRole<HTMLInputElement>("textbox", {
    name: "Link to Where next?",
  });
  expect(field.readOnly).toBe(true);
  expect(field.value).toBe(URL_);
  await waitFor(() => {
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(URL_.length);
  });
  expect(screen.getByText("Copy the selected link.")).toBeTruthy();

  // Already showing, so the state does not change; it must select again.
  field.setSelectionRange(0, 0);
  await userEvent.click(button);
  expect(field.selectionStart).toBe(0);
  expect(field.selectionEnd).toBe(URL_.length);
});

it("falls back to the field when the clipboard refuses", async () => {
  useClipboard({ writeText: vi.fn(() => Promise.reject(new Error("denied"))) });
  render(<CopyLink url={URL_} question="Where next?" />);
  await userEvent.click(
    screen.getByRole("button", { name: "Copy link to Where next?" }),
  );
  expect(
    await screen.findByRole("textbox", { name: "Link to Where next?" }),
  ).toBeTruthy();
});
