import { describe, expect, it } from "vitest";

import sr from "../../locales/sr.json";
import { makeSubject as subject } from "../../test/fixtures";
import { groupLabel, groupSubjects, visibleSubjects } from "./grouping";

const ADMIN = "admin";

describe("visibleSubjects", () => {
  const ownSubject = subject({ id: "own", lecturer: "pnikolic" });
  const asAssistant = subject({
    id: "assistant",
    lecturer: "mmarkovic",
    assistant: "pnikolic",
  });
  const someoneElses = subject({ id: "theirs", lecturer: "mmarkovic" });
  const inactive = subject({
    id: "inactive",
    lecturer: "pnikolic",
    isActive: false,
  });
  const all = [ownSubject, asAssistant, someoneElses, inactive];

  it("shows every running subject to an anonymous visitor", () => {
    expect(visibleSubjects(all, null, ADMIN).map((s) => s.id)).toEqual([
      "own",
      "assistant",
      "theirs",
    ]);
  });

  it("shows a lecturer only their own, as lecturer or as assistant", () => {
    const user = { username: "pnikolic" };

    expect(visibleSubjects(all, user, ADMIN).map((s) => s.id)).toEqual([
      "own",
      "assistant",
    ]);
  });

  it("shows an administrator everything", () => {
    const user = { username: ADMIN };

    expect(visibleSubjects(all, user, ADMIN).map((s) => s.id)).toEqual([
      "own",
      "assistant",
      "theirs",
    ]);
  });

  it("hides subjects that are not running from everyone, staff and admin included", () => {
    for (const user of [null, { username: "pnikolic" }, { username: ADMIN }]) {
      expect(visibleSubjects(all, user, ADMIN).map((s) => s.id)).not.toContain(
        "inactive",
      );
    }
  });
});

describe("groupSubjects", () => {
  it("groups on level and semester", () => {
    const groups = groupSubjects([
      subject({ id: "a", level: 1, semester: 1 }),
      subject({ id: "b", level: 1, semester: 1 }),
      subject({ id: "c", level: 1, semester: 3 }),
    ]);

    expect(groups.map(([key, s]) => [key, s.map((x) => x.id)])).toEqual([
      ["1-1", ["a", "b"]],
      ["1-3", ["c"]],
    ]);
  });

  it("sorts on level, then semester", () => {
    const groups = groupSubjects([
      subject({ id: "mss-1", level: 2, semester: 1 }),
      subject({ id: "oss-3", level: 1, semester: 3 }),
      subject({ id: "oss-1", level: 1, semester: 1 }),
    ]);

    expect(groups.map(([key]) => key)).toEqual(["1-1", "1-3", "2-1"]);
  });

  it("does not sort within a group - the order the API returned is kept", () => {
    // Current behaviour. 'order' is used only in the comparator between groups, never
    // inside one, so the display order there is inherited from /api/Subjects.
    const groups = groupSubjects([
      subject({ id: "late", level: 1, semester: 1, order: 5 }),
      subject({ id: "early", level: 1, semester: 1, order: 1 }),
    ]);

    expect(groups[0][1].map((s) => s.id)).toEqual(["late", "early"]);
  });

  it("sorts on nothing but level and semester", () => {
    // A third criterion on 'order' used to sit in the comparator, but could never run
    // and has been removed. This holds the ordering independent of it.
    const groups = groupSubjects([
      subject({ id: "b", level: 1, semester: 3, order: 0 }),
      subject({ id: "a", level: 1, semester: 1, order: 99 }),
    ]);

    // Purely semester-sorted; order = 99 does not push "a" back.
    expect(groups.map(([key]) => key)).toEqual(["1-1", "1-3"]);
  });

  it("gives an empty list for empty input", () => {
    expect(groupSubjects([])).toEqual([]);
  });
});

describe("groupLabel", () => {
  const cpt = sr.components.sidebar;

  it.each([
    ["1-1", "OSS • I godina • Zimski semestar"],
    ["1-2", "OSS • I godina • Letnji semestar"],
    ["1-3", "OSS • II godina • Zimski semestar"],
    ["1-6", "OSS • III godina • Letnji semestar"],
    ["2-1", "MSS • I godina • Zimski semestar"],
  ])("builds the label for %s", (key, expected) => {
    expect(groupLabel(key, cpt)).toBe(expected);
  });
});
