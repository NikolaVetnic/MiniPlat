import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../../../test/http";
import { renderWithSession, signIn, signOut } from "../../../test/render";
import { Level, type LecturerDetails, type LecturerSummary } from "../../../types/api";
import { fetchLecturer, fetchLecturers } from "../../../services/lecturersService";
import { updateSubjectPeople } from "../../../services/subjectsService";
import sr from "../../../locales/sr.json";
import SubjectCard from "./SubjectCard";

vi.mock("../../../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
  fetchLecturers: vi.fn(),
}));

vi.mock("../../../services/subjectsService", () => ({
  updateSubjectPeople: vi.fn(),
}));

const fetchOne = vi.mocked(fetchLecturer);
const fetchRoster = vi.mocked(fetchLecturers);
const saveStaff = vi.mocked(updateSubjectPeople);

const cpt = sr.components.cards.subject;

/** Set in vite.config.ts, so the rule is the same here as it is in CI. */
const ADMIN = "mp_admin";

const person = (username: string, over: Partial<LecturerDetails> = {}): LecturerDetails => ({
  username,
  title: "dr",
  firstName: "Petar",
  lastName: "Nikolic",
  department: "Psihologija",
  email: `${username}@example.com`,
  ...over,
});

const entry = (username: string, over: Partial<LecturerSummary> = {}): LecturerSummary => ({
  username,
  title: "dr",
  firstName: "Ime",
  lastName: username,
  ...over,
});

const show = (over: Partial<Parameters<typeof SubjectCard>[0]> = {}) =>
  renderWithSession(
    <SubjectCard
      id="s-1"
      title="Psihologija"
      code="PSI-101"
      level={Level.Undergraduate}
      semester={1}
      lecturerUsername="pnikolic"
      assistantUsername="mmarkovic"
      isActive={true}
      {...over}
    />
  );

/** Waits until the loading state is gone, which is when the card has content. */
const loaded = () => waitFor(() => expect(screen.queryByText(cpt.loading)).toBeNull());

beforeEach(() => {
  signOut();
  fetchOne.mockReset();
  fetchRoster.mockReset();
  saveStaff.mockReset();

  fetchOne.mockImplementation(async (username) => person(username));
  fetchRoster.mockResolvedValue([entry("pnikolic"), entry("mmarkovic"), entry("jjovic")]);
  saveStaff.mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  signOut();
  vi.restoreAllMocks();
});

describe("SubjectCard while it loads", () => {
  it("says the subject is loading until the lecturer has arrived", async () => {
    const response = deferred<LecturerDetails | null>();
    fetchOne.mockReturnValue(response.promise);

    show();

    expect(screen.getByText(cpt.loading)).toBeDefined();

    response.resolve(person("pnikolic"));
    await loaded();
  });

  it("shows the failure instead of the card when the lookup fails", async () => {
    fetchOne.mockRejectedValue(new Error("404"));

    show();

    expect(
      await screen.findByText("Unable to fetch lecturer information.")
    ).toBeDefined();
  });
});

describe("SubjectCard, what is always shown", () => {
  it("shows the subject code", async () => {
    show({ code: "PSI-101" });
    await loaded();

    expect(screen.getByText("PSI-101")).toBeDefined();
  });

  it.each([
    ["undergraduate", Level.Undergraduate, cpt.level.undergraduate],
    ["master", Level.Master, cpt.level.master],
  ])("shows the level for %s", async (_name, level, label) => {
    show({ level });
    await loaded();

    expect(screen.getByText(label)).toBeDefined();
  });

  /**
   * The year of study is derived from the semester: two semesters a year, odd ones in
   * winter and even ones in summer.
   */
  it.each([
    [1, 1, cpt.semester.winter],
    [2, 1, cpt.semester.summer],
    [3, 2, cpt.semester.winter],
    [4, 2, cpt.semester.summer],
    [6, 3, cpt.semester.summer],
  ])("reads semester %i as year %i, %s", async (semester, year, season) => {
    show({ semester });
    await loaded();

    expect(screen.getByText(`${year} (${season} semestar)`)).toBeDefined();
  });

  it.each([
    ["a running subject", true, cpt.active.true],
    ["one that is not running", false, cpt.active.false],
  ])("shows the status bar for %s", async (_name, isActive, label) => {
    show({ isActive });
    await loaded();

    expect(screen.getByText(label)).toBeDefined();
  });

  it("shows the lecturer and the assistant with title, name and e-mail", async () => {
    fetchOne.mockImplementation(async (username) =>
      username === "pnikolic"
        ? person("pnikolic", { firstName: "Petar", lastName: "Nikolic" })
        : person("mmarkovic", { title: "MA", firstName: "Milica", lastName: "Markovic" })
    );

    show();
    await loaded();

    expect(screen.getByText(/dr Petar Nikolic/)).toBeDefined();
    expect(screen.getByText(/MA Milica Markovic/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "pnikolic@example.com" }).getAttribute("href")
    ).toBe("mailto:pnikolic@example.com");
  });

  it("skips the assistant row when the subject has none", async () => {
    show({ assistantUsername: null });
    await loaded();

    expect(fetchOne).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(new RegExp(`${cpt.assistant}:`))).toBeNull();
  });

  it("leaves out the mail link for someone who has no address", async () => {
    fetchOne.mockImplementation(async (username) => person(username, { email: null }));

    show({ assistantUsername: null });
    await loaded();

    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("SubjectCard and who gets to edit", () => {
  it("shows no edit button to a visitor", async () => {
    show();
    await loaded();

    expect(screen.queryByRole("button")).toBeNull();
  });

  /**
   * Editing the staff is the administrator's alone - the server answers 403 for everyone
   * else, and the button is not in the tree for them.
   */
  it("shows no edit button to an ordinary lecturer", async () => {
    signIn("pnikolic");

    show();
    await loaded();

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the edit button and the subject title to the administrator", async () => {
    signIn(ADMIN);

    show({ title: "Psihologija" });
    await loaded();

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("Psihologija")).toBeDefined();
  });
});

describe("SubjectCard in edit mode", () => {
  const openEditor = async () => {
    signIn(ADMIN);
    show();
    await loaded();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(screen.getAllByRole("combobox")).toHaveLength(2));

    const [lecturer, assistant] = screen.getAllByRole("combobox");

    return { lecturer, assistant };
  };

  /** The roster is fetched only once the editor is open, so a visitor never pulls it. */
  it("does not ask for the roster before the editor is opened", async () => {
    signIn(ADMIN);
    show();
    await loaded();

    expect(fetchRoster).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(fetchRoster).toHaveBeenCalledTimes(1));
  });

  it("starts on the people already assigned to the subject", async () => {
    const { lecturer, assistant } = await openEditor();

    expect((lecturer as HTMLSelectElement).value).toBe("pnikolic");
    expect((assistant as HTMLSelectElement).value).toBe("mmarkovic");
  });

  it("lets the assistant be removed with the blank option", async () => {
    const { assistant } = await openEditor();

    fireEvent.change(assistant, { target: { value: "" } });

    expect((assistant as HTMLSelectElement).value).toBe("");
  });

  /**
   * One cannot also be the other. The server refuses it with a 400, and the lists here
   * leave out each other's selection so it cannot be asked for.
   */
  it("does not offer the chosen lecturer as the assistant", async () => {
    const { assistant } = await openEditor();

    const options = Array.from(assistant.querySelectorAll("option")).map((o) => o.value);

    expect(options).not.toContain("pnikolic");
    expect(options).toContain("jjovic");
  });

  /**
   * The saved lecturer has to stay in the list even when they are no longer on the roster
   * - otherwise the select would fall back to its first entry and a save would swap the
   * lecturer out without anyone asking for it.
   */
  it("keeps the saved lecturer selectable even when they are off the roster", async () => {
    fetchRoster.mockResolvedValue([entry("jjovic")]);

    const { lecturer } = await openEditor();

    expect((lecturer as HTMLSelectElement).value).toBe("pnikolic");
    expect(
      Array.from(lecturer.querySelectorAll("option")).map((o) => o.value)
    ).toContain("pnikolic");
  });

  it("saves the selection and reads the staff back", async () => {
    const { lecturer, assistant } = await openEditor();

    fireEvent.change(lecturer, { target: { value: "jjovic" } });
    fireEvent.change(assistant, { target: { value: "" } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() => expect(saveStaff).toHaveBeenCalledWith("s-1", "jjovic", null));

    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
  });

  it("puts back what was there when the edit is cancelled", async () => {
    const { lecturer } = await openEditor();

    fireEvent.change(lecturer, { target: { value: "jjovic" } });
    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
    expect(saveStaff).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() =>
      expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe(
        "pnikolic"
      )
    );
  });

  /**
   * A failed save leaves the editor open with the selection intact, so the user can try
   * again without having to find it a second time.
   */
  it("stays open with a message when the save fails", async () => {
    saveStaff.mockRejectedValue(new Error("403"));

    const { lecturer } = await openEditor();

    fireEvent.change(lecturer, { target: { value: "jjovic" } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    expect(await screen.findByText(cpt.saveFailed)).toBeDefined();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("jjovic");
  });

  it("says so when the roster could not be fetched", async () => {
    fetchRoster.mockRejectedValue(new Error("401"));

    await openEditor();

    expect(await screen.findByText("Unable to fetch lecturer list.")).toBeDefined();
  });
});
