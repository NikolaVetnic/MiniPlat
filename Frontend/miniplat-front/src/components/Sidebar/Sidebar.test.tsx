import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject } from "../../test/fixtures";
import { renderWithSession, signIn, signOut } from "../../test/render";
import { Level } from "../../types/api";
import { groupLabel } from "./grouping";
import sr from "../../locales/sr.json";
import Sidebar from "./Sidebar";

const cpt = sr.components.sidebar;

// NavItem numbers the text - "1 Psihologija" - so subject titles are matched by regex.

/** Set in vite.config.ts, so the rule is the same here as it is in CI. */
const ADMIN = "mp_admin";

const STORAGE_KEY = "sidebarExpandedGroups";

const subjects = [
  makeSubject({
    id: "s-1",
    title: "Psihologija",
    lecturer: "pnikolic",
    assistant: null,
    level: Level.Undergraduate,
    semester: 1,
  }),
  makeSubject({
    id: "s-2",
    title: "Pedagogija",
    lecturer: "mmarkovic",
    assistant: "pnikolic",
    level: Level.Undergraduate,
    semester: 1,
  }),
  makeSubject({
    id: "s-3",
    title: "Metodika",
    lecturer: "jjovic",
    assistant: null,
    level: Level.Master,
    semester: 3,
  }),
];

const firstGroup = groupLabel("1-1", cpt);
const secondGroup = groupLabel("2-3", cpt);

const show = (props: Parameters<typeof Sidebar>[0] = {}) =>
  renderWithSession(<Sidebar {...props} />);

beforeEach(() => {
  signOut();
  localStorage.removeItem(STORAGE_KEY);
});

afterEach(() => {
  signOut();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  it("shows a spinner instead of the tree while the subjects load", () => {
    show({ subjects, loading: true });

    expect(screen.queryByText(firstGroup)).toBeNull();
  });

  it("groups the subjects on level and semester", () => {
    show({ subjects });

    expect(screen.getByText(firstGroup)).toBeDefined();
    expect(screen.getByText(secondGroup)).toBeDefined();
  });

  /** The groups start closed, so a long list does not unroll on a first visit. */
  it("starts with the groups closed", () => {
    show({ subjects });

    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });

  it("opens a group when it is clicked", () => {
    show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Pedagogija/)).toBeDefined();
    expect(screen.queryByText(/Metodika/)).toBeNull();
  });

  it("closes it again on the next click", () => {
    show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));
    fireEvent.click(screen.getByText(firstGroup));

    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });

  /** The tree should look the way it did, or you click your way back on every navigation. */
  it("remembers which groups were left open", () => {
    const { unmount } = show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));
    unmount();

    show({ subjects });

    expect(screen.getByText(/Psihologija/)).toBeDefined();
  });

  it("tolerates stored data that makes no sense", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    show({ subjects });

    expect(screen.getByText(firstGroup)).toBeDefined();
    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });
});

describe("Sidebar and which subjects it shows", () => {
  it("shows every running subject to a visitor", () => {
    show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));
    fireEvent.click(screen.getByText(secondGroup));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Metodika/)).toBeDefined();
  });

  /**
   * A signed-in member of staff sees only their own subjects - as lecturer or assistant.
   * The server decides the same thing for the write calls; this is the navigation that
   * follows from it.
   */
  it("shows a lecturer only the subjects they are responsible for", () => {
    signIn("pnikolic");

    show({ subjects });

    expect(screen.getByText(firstGroup)).toBeDefined();
    expect(screen.queryByText(secondGroup)).toBeNull();

    fireEvent.click(screen.getByText(firstGroup));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Pedagogija/)).toBeDefined();
  });

  it("shows the administrator everything", () => {
    signIn(ADMIN);

    show({ subjects });

    expect(screen.getByText(firstGroup)).toBeDefined();
    expect(screen.getByText(secondGroup)).toBeDefined();
  });

  it("leaves out subjects that are not running", () => {
    show({
      subjects: [
        makeSubject({ id: "s-1", title: "Running", semester: 1, isActive: true }),
        makeSubject({ id: "s-2", title: "Inactive", semester: 1, isActive: false }),
      ],
    });

    fireEvent.click(screen.getByText(firstGroup));

    expect(screen.getByText(/Running/)).toBeDefined();
    expect(screen.queryByText(/Inactive/)).toBeNull();
  });

  it("shows no groups when there are no subjects", () => {
    show({ subjects: [] });

    expect(screen.queryByText(firstGroup)).toBeNull();
    expect(screen.getByText(cpt.home)).toBeDefined();
  });
});

describe("Sidebar and the links", () => {
  it("points at the public addresses for a visitor", () => {
    show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));

    expect(
      screen.getByRole("link", { name: /Psihologija/ }).getAttribute("href")
    ).toBe("/subjects/s-1");
    expect(screen.getByRole("link", { name: cpt.home }).getAttribute("href")).toBe(
      "/home"
    );
  });

  it("points at the user's own addresses when someone is signed in", () => {
    signIn("pnikolic");

    show({ subjects });

    fireEvent.click(screen.getByText(firstGroup));

    expect(
      screen.getByRole("link", { name: /Psihologija/ }).getAttribute("href")
    ).toBe("/pnikolic/subjects/s-1");
    expect(screen.getByRole("link", { name: cpt.home }).getAttribute("href")).toBe(
      "/pnikolic/home"
    );
  });

  it("encodes the subject id into the address", () => {
    show({
      subjects: [makeSubject({ id: "a b/c", title: "Odd", semester: 1 })],
    });

    fireEvent.click(screen.getByText(firstGroup));

    expect(screen.getByRole("link", { name: /Odd/ }).getAttribute("href")).toBe(
      "/subjects/a%20b%2Fc"
    );
  });
});
