// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import {
  SAMPLE_COMMENTS,
  commentsWithStance,
  randomSample,
  visibleComments,
} from "../src/flow/comment-visibility.js";
import { CommentVisibilityPreview } from "../src/screens/CommentVisibilityPreview.js";

afterEach(cleanup);

it("keeps mixed, uncertain and moderated examples out of stance groups", () => {
  expect(
    commentsWithStance(SAMPLE_COMMENTS, "Garden", "support").map((c) => c.id),
  ).toEqual(["1", "5", "7"]);
  expect(
    commentsWithStance(SAMPLE_COMMENTS, "Garden", "oppose").map((c) => c.id),
  ).toEqual(["2", "3"]);
  expect(visibleComments(SAMPLE_COMMENTS).map((c) => c.id)).not.toContain("9");
  expect(commentsWithStance(SAMPLE_COMMENTS, "Playground", "oppose")).toEqual(
    [],
  );
});

it("offers three equally scoped views and the complete chronological baseline", async () => {
  render(<CommentVisibilityPreview />);
  const main = screen.getByRole("main");
  expect(within(main).getByText(/does not read real comments/)).toBeTruthy();
  const views = main.querySelector(".comment-preview__views")!;
  expect(views.querySelectorAll(":scope > section")).toHaveLength(3);
  expect(
    within(views as HTMLElement).getByRole("heading", {
      name: "Agreeing with Garden",
    }),
  ).toBeTruthy();
  expect(
    within(views as HTMLElement).getByRole("heading", {
      name: "Opposing Garden",
    }),
  ).toBeTruthy();
  expect(
    within(views as HTMLElement).getByRole("heading", {
      name: "Random sample",
    }),
  ).toBeTruthy();
  const baseline = main.querySelector(".comment-preview__baseline")!;
  expect(baseline.querySelectorAll("li")).toHaveLength(8);
  expect(baseline.textContent).not.toContain(
    "This sample is excluded by moderation",
  );

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Reference viewpoint" }),
    "Playground",
  );
  expect(
    screen.getByRole("heading", { name: "Opposing Playground" }),
  ).toBeTruthy();
  expect(
    screen.getByText("No sample comments explicitly oppose Playground."),
  ).toBeTruthy();
  expect(baseline.querySelectorAll("li")).toHaveLength(8);
});

it("shuffles only the sample and never changes the chronological thread", async () => {
  render(<CommentVisibilityPreview />);
  const baseline = screen
    .getByRole("heading", { name: "Original chronological thread" })
    .closest("section")!;
  const original = baseline.textContent;
  const sampleSection = screen
    .getByRole("heading", { name: "Random sample" })
    .closest("section")!;
  expect(sampleSection.querySelectorAll("li")).toHaveLength(3);
  const button = screen.getByRole("button", { name: "Shuffle sample" });
  button.focus();
  const before = [...sampleSection.querySelectorAll("li")].map(
    (one) => one.textContent,
  );
  await userEvent.keyboard("{Enter}");
  expect(sampleSection.querySelectorAll("li")).toHaveLength(3);
  const after = [...sampleSection.querySelectorAll("li")].map(
    (one) => one.textContent,
  );
  expect(after.every((one) => before.includes(one))).toBe(false);
  expect(baseline.textContent).toBe(original);
  expect(within(sampleSection).getByRole("status").textContent).toBe(
    "New random sample. The thread and any votes are unchanged.",
  );
});

it("changes the sampled set even when the shuffle lands on the same three", () => {
  // A random() of 0.999 leaves every position where it is.
  const first = randomSample(SAMPLE_COMMENTS, [], () => 0.999);
  const firstIds = first.map((one) => one.id);
  for (const previous of [firstIds, [...firstIds].reverse()]) {
    const next = randomSample(SAMPLE_COMMENTS, previous, () => 0.999);
    expect(next).toHaveLength(3);
    expect(next.every((one) => previous.includes(one.id))).toBe(false);
  }
});

it("counts one sample comment in the singular", async () => {
  render(<CommentVisibilityPreview />);
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Reference viewpoint" }),
    "Housing",
  );
  const opposing = screen
    .getByRole("heading", { name: "Opposing Housing" })
    .closest("section")!;
  expect(within(opposing).getByText("1 sample comment")).toBeTruthy();
});

it("never samples a hidden comment", () => {
  for (let i = 0; i < 10; i++) {
    expect(randomSample(SAMPLE_COMMENTS).map((one) => one.id)).not.toContain(
      "9",
    );
  }
});
