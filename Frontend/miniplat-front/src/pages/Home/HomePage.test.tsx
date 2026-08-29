import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject } from "../../test/fixtures";
import { loggInn, loggUt } from "../../test/render";
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

const hentEmner = vi.mocked(fetchSubjects);

const cpt = sr.pages.home;

/** Satt i vite.config.ts, så regelen er den samme her som i CI. */
const ADMIN = "mp_admin";

const vis = (route: string) =>
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
  loggUt();
  localStorage.clear();

  hentEmner.mockReset().mockResolvedValue([makeSubject({ id: "s-1", semester: 1 })]);
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
  loggUt();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("HomePage og hvem som ser hva", () => {
  it("viser studentveiledningen til en besøkende", async () => {
    vis("/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(cpt.home);
  });

  it("viser lærerveiledningen til en innlogget nastavnik", async () => {
    loggInn("pnikolic");

    vis("/pnikolic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
    expect(screen.queryByText(/Poštovani studenti/)).toBeNull();
  });

  it("viser kontrollpanelet til administratoren", async () => {
    loggInn(ADMIN);

    vis(`/${ADMIN}/home`);

    expect(await screen.findByRole("button", { name: cpt.buttons.dumpDatabaseAsYaml }))
      .toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      cpt.adminControlPanel
    );
  });

  it("viser ikke nedlastingsknappen til noen andre", async () => {
    loggInn("pnikolic");

    vis("/pnikolic/home");

    await screen.findByText(/Poštovani profesori/);

    expect(
      screen.queryByRole("button", { name: cpt.buttons.dumpDatabaseAsYaml })
    ).toBeNull();
  });
});

describe("HomePage og den private ruten", () => {
  /**
   * /noen/home er noens egen side. Uten økt finnes den ikke, og da er den offentlige
   * forsiden svaret - ikke en tom side med noen andres navn i adressen.
   */
  it("sender en uten økt til den offentlige forsiden", async () => {
    vis("/pnikolic/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
  });

  /**
   * Å skrive inn en kollegas brukernavn i adressen skal ikke vise kollegaens side.
   * Serveren avgjør uansett hvilke emner som kommer tilbake, men ruten skal heller
   * ikke gi inntrykk av noe annet.
   */
  it("sender deg til din egen side når adressen nevner en annen", async () => {
    loggInn("pnikolic");

    vis("/mmarkovic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
  });

  it("lar deg være på din egen side", async () => {
    loggInn("pnikolic");

    vis("/pnikolic/home");

    expect(await screen.findByText(/Poštovani profesori/)).toBeDefined();
  });
});

describe("HomePage og emnene", () => {
  it("henter katalogen én gang", async () => {
    vis("/home");

    await screen.findByText(/Poštovani studenti/);

    await waitFor(() => expect(hentEmner).toHaveBeenCalledTimes(1));
  });

  /** En katalog som ikke kan hentes gir en tom sidebar, ikke en side som ikke tegnes. */
  it("viser siden også når katalogen ikke kunne hentes", async () => {
    hentEmner.mockRejectedValue(new Error("500"));

    vis("/home");

    expect(await screen.findByText(/Poštovani studenti/)).toBeDefined();
  });
});
