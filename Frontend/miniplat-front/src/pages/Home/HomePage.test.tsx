import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject } from "../../test/fixtures";
import { signIn, signOut } from "../../test/render";
import { UserProvider } from "../../contexts/UserContext";
import { fetchSubjects } from "../../services/subjectsService";
import { fetchLecturer, fetchLecturers } from "../../services/lecturersService";
import { fetchUserInfo } from "../../services/authService";
import sr from "../../locales/sr.json";
import HomePage from "./HomePage";

vi.mock("../../services/subjectsService", () => ({
  fetchSubjects: vi.fn(),
}));

vi.mock("../../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
  fetchLecturers: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  fetchUserInfo: vi.fn(),
}));

const fetchCatalogue = vi.mocked(fetchSubjects);

const cpt = sr.pages.home;

/** Set in vite.config.ts, so the rule is the same here as it is in CI. */
const ADMIN = "mp_admin";

const show = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <UserProvider>
        <Routes>
          <Route path="/home" element={<HomePage onLogout={vi.fn()} />} />
          <Route path="/:username/home" element={<HomePage onLogout={vi.fn()} />} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  signOut();
  localStorage.clear();

  fetchCatalogue.mockReset().mockResolvedValue([makeSubject({ id: "s-1", semester: 1 })]);
  vi.mocked(fetchLecturer).mockResolvedValue(null);
  vi.mocked(fetchLecturers).mockResolvedValue([]);
  vi.mocked(fetchUserInfo).mockResolvedValue({
    sub: "1",
    username: ADMIN,
    email: "admin@example.com",
    firstName: "Mini",
    lastName: "Plat",
    title: "dr",
    department: "Uprava",
  });

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  signOut();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("HomePage and who sees what", () => {
  it("shows the student guide to a visitor", async () => {
    show("/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(cpt.home);
  });

  it("shows the staff guide to a signed-in lecturer", async () => {
    signIn("pnikolic");

    show("/pnikolic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
    expect(screen.queryByText(/Poštovani studenti/)).toBeNull();
  });

  it("shows the control panel to the administrator", async () => {
    signIn(ADMIN);

    show(`/${ADMIN}/home`);

    expect(
      await screen.findByRole("button", { name: cpt.buttons.dumpDatabaseAsYaml })
    ).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      cpt.adminControlPanel
    );
  });

  it("shows the download button to nobody else", async () => {
    signIn("pnikolic");

    show("/pnikolic/home");

    await screen.findByText(/Poštovani profesori/);

    expect(
      screen.queryByRole("button", { name: cpt.buttons.dumpDatabaseAsYaml })
    ).toBeNull();
  });
});

describe("HomePage and the private route", () => {
  /**
   * /someone/home is that person's own page. Without a session it does not exist, and the
   * public home page is the answer - not an empty page with someone else's name in the
   * address.
   */
  it("sends someone without a session to the public home page", async () => {
    show("/pnikolic/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
  });

  /**
   * Typing a colleague's username into the address must not show the colleague's page.
   * The server decides which subjects come back anyway, but the route should not suggest
   * otherwise either.
   */
  it("sends you to your own page when the address names someone else", async () => {
    signIn("pnikolic");

    show("/mmarkovic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
  });

  it("lets you stay on your own page", async () => {
    signIn("pnikolic");

    show("/pnikolic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
  });
});

describe("HomePage and the subjects", () => {
  it("fetches the catalogue once", async () => {
    show("/home");

    await screen.findByText(/Poštovani studenti/);

    await waitFor(() => expect(fetchCatalogue).toHaveBeenCalledTimes(1));
  });

  /** A catalogue that cannot be fetched gives an empty sidebar, not a page that fails to render. */
  it("shows the page even when the catalogue could not be fetched", async () => {
    fetchCatalogue.mockRejectedValue(new Error("500"));

    show("/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
  });
});
