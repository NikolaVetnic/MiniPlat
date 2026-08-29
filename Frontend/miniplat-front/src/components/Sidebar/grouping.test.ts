import { describe, expect, it } from "vitest";

import sr from "../../locales/sr.json";
import { makeSubject as subject } from "../../test/fixtures";
import { groupLabel, groupSubjects, visibleSubjects } from "./grouping";

const ADMIN = "admin";

describe("visibleSubjects", () => {
  const egen = subject({ id: "egen", lecturer: "pnikolic" });
  const somAsistent = subject({
    id: "asistent",
    lecturer: "mmarkovic",
    assistant: "pnikolic",
  });
  const andres = subject({ id: "andres", lecturer: "mmarkovic" });
  const inaktiv = subject({
    id: "inaktiv",
    lecturer: "pnikolic",
    isActive: false,
  });
  const alle = [egen, somAsistent, andres, inaktiv];

  it("viser alle aktive emner til anonyme besøkende", () => {
    expect(visibleSubjects(alle, null, ADMIN).map((s) => s.id)).toEqual([
      "egen",
      "asistent",
      "andres",
    ]);
  });

  it("viser en foreleser bare egne emner, som professor eller asistent", () => {
    const user = { username: "pnikolic" };

    expect(visibleSubjects(alle, user, ADMIN).map((s) => s.id)).toEqual([
      "egen",
      "asistent",
    ]);
  });

  it("viser admin alt", () => {
    const user = { username: ADMIN };

    expect(visibleSubjects(alle, user, ADMIN).map((s) => s.id)).toEqual([
      "egen",
      "asistent",
      "andres",
    ]);
  });

  it("skjuler inaktive emner for alle, også for eieren og admin", () => {
    for (const user of [null, { username: "pnikolic" }, { username: ADMIN }]) {
      expect(visibleSubjects(alle, user, ADMIN).map((s) => s.id)).not.toContain(
        "inaktiv",
      );
    }
  });
});

describe("groupSubjects", () => {
  it("grupperer på nivå og semester", () => {
    const grupper = groupSubjects([
      subject({ id: "a", level: 1, semester: 1 }),
      subject({ id: "b", level: 1, semester: 1 }),
      subject({ id: "c", level: 1, semester: 3 }),
    ]);

    expect(grupper.map(([key, s]) => [key, s.map((x) => x.id)])).toEqual([
      ["1-1", ["a", "b"]],
      ["1-3", ["c"]],
    ]);
  });

  it("sorterer på nivå, så semester", () => {
    const grupper = groupSubjects([
      subject({ id: "mss-1", level: 2, semester: 1 }),
      subject({ id: "oss-3", level: 1, semester: 3 }),
      subject({ id: "oss-1", level: 1, semester: 1 }),
    ]);

    expect(grupper.map(([key]) => key)).toEqual(["1-1", "1-3", "2-1"]);
  });

  it("sorterer ikke innenfor en gruppe - API-rekkefølgen beholdes", () => {
    // Dagens adferd. 'order' brukes kun i komparatoren mellom grupper, aldri inne i
    // en gruppe, så visningsrekkefølgen der arves fra svaret på /api/Subjects.
    const grupper = groupSubjects([
      subject({ id: "sen", level: 1, semester: 1, order: 5 }),
      subject({ id: "tidlig", level: 1, semester: 1, order: 1 }),
    ]);

    expect(grupper[0][1].map((s) => s.id)).toEqual(["sen", "tidlig"]);
  });

  it("sorterer utelukkende på nivå og semester", () => {
    // Et tredje kriterium på 'order' sto i komparatoren, men kunne aldri kjøre og er
    // fjernet. Testen holder fast at rekkefølgen er upåvirket av order.
    const grupper = groupSubjects([
      subject({ id: "b", level: 1, semester: 3, order: 0 }),
      subject({ id: "a", level: 1, semester: 1, order: 99 }),
    ]);

    // Rent semester-sortert; order = 99 flytter ikke "a" bakover.
    expect(grupper.map(([key]) => key)).toEqual(["1-1", "1-3"]);
  });

  it("gir tom liste for tomt innhold", () => {
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
  ])("bygger etiketten for %s", (key, forventet) => {
    expect(groupLabel(key, cpt)).toBe(forventet);
  });
});
