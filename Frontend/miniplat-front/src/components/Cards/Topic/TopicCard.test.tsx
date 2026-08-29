import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMaterial, makeTopic } from "../../../test/fixtures";
import { renderWithSession, signIn, signOut } from "../../../test/render";
import sr from "../../../locales/sr.json";
import TopicCard from "./TopicCard";
import type { Topic } from "../../../types/api";

const cpt = sr.components.cards.topic;

const handlers = () => ({
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onEdit: vi.fn(),
  onToggleVisibility: vi.fn(),
  onToggleDeletion: vi.fn(),
});

const show = (
  topic: Topic,
  { index = 0, total = 1, ...rest }: { index?: number; total?: number } = {}
) => {
  const spies = handlers();

  renderWithSession(
    <TopicCard topic={topic} index={index} total={total} {...spies} {...rest} />
  );

  return spies;
};

beforeEach(() => {
  signOut();
});

afterEach(() => {
  signOut();
});

describe("TopicCard, as a visitor sees it", () => {
  it("shows the title, the description and the materials", () => {
    show(
      makeTopic({
        title: "Prvo predavanje",
        description: "Uvod u temu",
        materials: [makeMaterial({ description: "Skripta" })],
      })
    );

    expect(screen.getByText("Prvo predavanje")).toBeDefined();
    expect(screen.getByText("Uvod u temu")).toBeDefined();
    expect(screen.getByText(/Skripta/)).toBeDefined();
  });

  /**
   * The buttons are not in the tree at all for someone who is not signed in - they are
   * not merely hidden with css, which would leave them clickable from the console.
   */
  it("has no editing controls", () => {
    show(makeTopic(), { index: 1, total: 3 });

    expect(screen.queryByRole("button")).toBeNull();
  });

  /**
   * The status bar says whether a topic is hidden or deleted. The server sends a visitor
   * no hidden topics anyway, but the bar belongs to the editing view.
   */
  it("has no status bar", () => {
    show(makeTopic());

    expect(screen.queryByText(cpt.status.active)).toBeNull();
  });
});

describe("TopicCard, as a signed-in user sees it", () => {
  beforeEach(() => {
    signIn();
  });

  it("shows the buttons for editing, hiding and deleting", () => {
    show(makeTopic());

    expect(screen.getByRole("button", { name: cpt.buttons.edit })).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.hide })).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.delete })).toBeDefined();
  });

  /**
   * The arrows exist only where they have something to do: the top topic cannot move up,
   * and the bottom one cannot move down.
   */
  it.each([
    ["the first of three", 0, 3, false, true],
    ["one in the middle", 1, 3, true, true],
    ["the last of three", 2, 3, true, false],
    ["the only one", 0, 1, false, false],
  ])("shows the arrows that suit %s", (_name, index, total, up, down) => {
    show(makeTopic(), { index, total });

    expect(screen.queryByRole("button", { name: "↑" }) !== null).toBe(up);
    expect(screen.queryByRole("button", { name: "↓" }) !== null).toBe(down);
  });

  it("reports a move with its own position", () => {
    const spies = show(makeTopic(), { index: 1, total: 3 });

    fireEvent.click(screen.getByRole("button", { name: "↑" }));
    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    expect(spies.onMoveUp).toHaveBeenCalledWith(1);
    expect(spies.onMoveDown).toHaveBeenCalledWith(1);
  });

  it("reports hiding and deleting with the topic id", () => {
    const spies = show(makeTopic({ id: "t-1" }));

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.hide }));
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.delete }));

    expect(spies.onToggleVisibility).toHaveBeenCalledWith("t-1");
    expect(spies.onToggleDeletion).toHaveBeenCalledWith("t-1");
  });

  /** The button says what it will do, not what state the topic is in. */
  it.each([
    ["a visible topic", false, cpt.buttons.hide],
    ["a hidden topic", true, cpt.buttons.show],
  ])("offers %s the right action", (_name, isHidden, label) => {
    show(makeTopic({ isHidden }));

    expect(screen.getByRole("button", { name: label })).toBeDefined();
  });

  it.each([
    ["a live topic", false, cpt.buttons.delete],
    ["a deleted topic", true, cpt.buttons.putBack],
  ])("offers %s the right action", (_name, isDeleted, label) => {
    show(makeTopic({ isDeleted }));

    expect(screen.getByRole("button", { name: label })).toBeDefined();
  });

  it.each([
    ["active", false, false, cpt.status.active],
    ["hidden", true, false, cpt.status.hidden],
    ["deleted", false, true, cpt.status.deleted],
    ["hidden and deleted", true, true, cpt.status.hiddenAndDeleted],
  ])("shows the status %s", (_name, isHidden, isDeleted, label) => {
    show(makeTopic({ isHidden, isDeleted }));

    expect(screen.getByText(label)).toBeDefined();
  });
});

describe("TopicCard and the materials", () => {
  it("links to a material with a safe address", () => {
    show(
      makeTopic({
        materials: [
          makeMaterial({ description: "Skripta", link: "https://example.com/s.pdf" }),
        ],
      })
    );

    const link = screen.getByRole("link", { name: "https://example.com/s.pdf" });

    expect(link.getAttribute("href")).toBe("https://example.com/s.pdf");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  /**
   * A lecturer could have stored a script address. It is shown as text, not as something
   * a student can click - the link simply does not exist in the tree.
   */
  it.each([
    ["a javascript", "javascript:alert(1)"],
    ["a data", "data:text/html,<script>alert(1)</script>"],
    ["a file", "file:///etc/passwd"],
  ])("does not link to %s address", (_name, link) => {
    show(makeTopic({ materials: [makeMaterial({ link })] }));

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(link)).toBeDefined();
  });

  it("shows no materials section when the topic has none", () => {
    show(makeTopic({ materials: [] }));

    expect(screen.queryByText(`${cpt.materials}:`)).toBeNull();
  });
});

describe("TopicCard and the timestamp", () => {
  it("shows when the topic was last changed", () => {
    show(makeTopic({ lastModifiedAt: "2026-03-14T10:00:00.000Z" }));

    expect(screen.getByText(new RegExp(cpt.updatedAt))).toBeDefined();
  });

  /**
   * Without a timestamp the whole line is dropped. new Date(null) is the epoch, and
   * "last changed 1 January 1970" looks like a real date.
   */
  it("drops the line entirely when the timestamp is missing", () => {
    show(makeTopic({ lastModifiedAt: null }));

    expect(screen.queryByText(new RegExp(cpt.updatedAt))).toBeNull();
  });
});

describe("TopicCard and the edit dialog", () => {
  beforeEach(() => {
    signIn();
  });

  const open = () =>
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.edit }));

  it("opens with the topic's current content", () => {
    show(makeTopic({ title: "Prvo predavanje", description: "Uvod" }));

    open();

    expect(screen.getByDisplayValue("Prvo predavanje")).toBeDefined();
    expect(screen.getByDisplayValue("Uvod")).toBeDefined();
  });

  it("hands the edited topic on with its id intact", () => {
    const spies = show(makeTopic({ id: "t-1", title: "Before" }));

    open();

    fireEvent.change(screen.getByDisplayValue("Before"), {
      target: { value: "After" },
    });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect(spies.onEdit).toHaveBeenCalledTimes(1);

    const sent = spies.onEdit.mock.calls[0][0] as Topic;

    expect(sent.id).toBe("t-1");
    expect(sent.title).toBe("After");
  });

  it("stamps the change with the moment it was made", () => {
    const spies = show(makeTopic({ lastModifiedAt: "2020-01-01T00:00:00.000Z" }));

    open();
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    const sent = spies.onEdit.mock.calls[0][0] as Topic;

    expect(sent.lastModifiedAt).not.toBe("2020-01-01T00:00:00.000Z");
    expect(Date.parse(sent.lastModifiedAt!)).toBeGreaterThan(0);
  });

  /**
   * Material rows left entirely blank fall away on the way out, so a slip in the form
   * does not become an empty row on the subject.
   */
  it("drops material rows that were left blank", () => {
    const spies = show(makeTopic({ materials: [] }));

    open();
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.addMaterial }));
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect((spies.onEdit.mock.calls[0][0] as Topic).materials).toEqual([]);
  });

  it("closes without reporting anything when the edit is cancelled", () => {
    const spies = show(makeTopic());

    open();
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    expect(spies.onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: cpt.buttons.save })).toBeNull();
  });

  /**
   * The button reads the fields off the topic again every time. Without that the dialog
   * would show whatever was left there last, after the subject has been saved and read
   * back.
   */
  it("takes the content fresh every time it opens", () => {
    const spies = show(makeTopic({ title: "Original" }));

    open();

    fireEvent.change(screen.getByDisplayValue("Original"), {
      target: { value: "Discarded" },
    });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    open();

    expect(screen.getByDisplayValue("Original")).toBeDefined();
    expect(spies.onEdit).not.toHaveBeenCalled();
  });

  it("refuses to save a topic without a title", () => {
    const spies = show(makeTopic({ title: "Has a title" }));

    open();
    fireEvent.change(screen.getByDisplayValue("Has a title"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect(spies.onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: cpt.buttons.save })).toBeDefined();
  });
});
