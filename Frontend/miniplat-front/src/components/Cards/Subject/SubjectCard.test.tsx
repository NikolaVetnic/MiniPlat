import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../../../test/http";
import { loggInn, loggUt, renderMedØkt } from "../../../test/render";
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

const hentForeleser = vi.mocked(fetchLecturer);
const hentStaben = vi.mocked(fetchLecturers);
const lagreStab = vi.mocked(updateSubjectPeople);

const cpt = sr.components.cards.subject;

/** Satt i vite.config.ts, så regelen er den samme her som i CI. */
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

const oppføring = (username: string, over: Partial<LecturerSummary> = {}): LecturerSummary => ({
  username,
  title: "dr",
  firstName: "Ime",
  lastName: username,
  ...over,
});

const vis = (over: Partial<Parameters<typeof SubjectCard>[0]> = {}) =>
  renderMedØkt(
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

/** Venter til lastetilstanden er borte, som er når kortet har innhold. */
const ferdigLastet = () =>
  waitFor(() => expect(screen.queryByText(cpt.loading)).toBeNull());

beforeEach(() => {
  loggUt();
  hentForeleser.mockReset();
  hentStaben.mockReset();
  lagreStab.mockReset();

  hentForeleser.mockImplementation(async (username) => person(username));
  hentStaben.mockResolvedValue([oppføring("pnikolic"), oppføring("mmarkovic"), oppføring("jjovic")]);
  lagreStab.mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  loggUt();
  vi.restoreAllMocks();
});

describe("SubjectCard mens den laster", () => {
  it("sier fra at emnet lastes til foreleseren er hentet", async () => {
    const svar = deferred<LecturerDetails | null>();
    hentForeleser.mockReturnValue(svar.promise);

    vis();

    expect(screen.getByText(cpt.loading)).toBeDefined();

    svar.resolve(person("pnikolic"));
    await ferdigLastet();
  });

  it("viser feilen i stedet for kortet når oppslaget feiler", async () => {
    hentForeleser.mockRejectedValue(new Error("404"));

    vis();

    expect(
      await screen.findByText("Unable to fetch lecturer information.")
    ).toBeDefined();
  });
});

describe("SubjectCard, det som alltid vises", () => {
  it("viser emnekoden", async () => {
    vis({ code: "PSI-101" });
    await ferdigLastet();

    expect(screen.getByText("PSI-101")).toBeDefined();
  });

  it.each([
    ["grunnstudier", Level.Undergraduate, cpt.level.undergraduate],
    ["master", Level.Master, cpt.level.master],
  ])("viser nivået for %s", async (_navn, level, tekst) => {
    vis({ level });
    await ferdigLastet();

    expect(screen.getByText(tekst)).toBeDefined();
  });

  /**
   * Studieåret regnes ut av semesteret: to semestre per år, oddetall er høst og
   * partall er vår.
   */
  it.each([
    [1, 1, cpt.semester.winter],
    [2, 1, cpt.semester.summer],
    [3, 2, cpt.semester.winter],
    [4, 2, cpt.semester.summer],
    [6, 3, cpt.semester.summer],
  ])("regner semester %i som år %i, %s", async (semester, år, sesong) => {
    vis({ semester });
    await ferdigLastet();

    expect(screen.getByText(`${år} (${sesong} semestar)`)).toBeDefined();
  });

  it.each([
    ["et aktivt emne", true, cpt.active.true],
    ["et inaktivt emne", false, cpt.active.false],
  ])("viser statuslinjen for %s", async (_navn, isActive, tekst) => {
    vis({ isActive });
    await ferdigLastet();

    expect(screen.getByText(tekst)).toBeDefined();
  });

  it("viser foreleser og assistent med tittel, navn og e-post", async () => {
    hentForeleser.mockImplementation(async (username) =>
      username === "pnikolic"
        ? person("pnikolic", { firstName: "Petar", lastName: "Nikolic" })
        : person("mmarkovic", { title: "MA", firstName: "Milica", lastName: "Markovic" })
    );

    vis();
    await ferdigLastet();

    expect(screen.getByText(/dr Petar Nikolic/)).toBeDefined();
    expect(screen.getByText(/MA Milica Markovic/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "pnikolic@example.com" }).getAttribute("href")
    ).toBe("mailto:pnikolic@example.com");
  });

  it("hopper over assistentraden når emnet ikke har noen", async () => {
    vis({ assistantUsername: null });
    await ferdigLastet();

    expect(hentForeleser).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(new RegExp(`${cpt.assistant}:`))).toBeNull();
  });

  it("utelater e-postlenken for en som ikke har noen", async () => {
    hentForeleser.mockImplementation(async (username) => person(username, { email: null }));

    vis({ assistantUsername: null });
    await ferdigLastet();

    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("SubjectCard og hvem som får redigere", () => {
  it("viser ingen redigeringsknapp for en besøkende", async () => {
    vis();
    await ferdigLastet();

    expect(screen.queryByRole("button")).toBeNull();
  });

  /**
   * Redigering av staben er forbeholdt administratoren - serveren svarer 403 på alle
   * andre, og knappen finnes ikke i treet for dem.
   */
  it("viser ingen redigeringsknapp for en vanlig foreleser", async () => {
    loggInn("pnikolic");

    vis();
    await ferdigLastet();

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("viser redigeringsknappen og emnetittelen for administratoren", async () => {
    loggInn(ADMIN);

    vis({ title: "Psihologija" });
    await ferdigLastet();

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("Psihologija")).toBeDefined();
  });
});

describe("SubjectCard i redigeringsmodus", () => {
  const åpneEditoren = async () => {
    loggInn(ADMIN);
    vis();
    await ferdigLastet();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(screen.getAllByRole("combobox")).toHaveLength(2));

    const [foreleser, assistent] = screen.getAllByRole("combobox");

    return { foreleser, assistent };
  };

  /** Staben hentes først når editoren åpnes, så en besøkende aldri drar ned listen. */
  it("ber ikke om staben før editoren åpnes", async () => {
    loggInn(ADMIN);
    vis();
    await ferdigLastet();

    expect(hentStaben).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(hentStaben).toHaveBeenCalledTimes(1));
  });

  it("starter med de som allerede står på emnet", async () => {
    const { foreleser, assistent } = await åpneEditoren();

    expect((foreleser as HTMLSelectElement).value).toBe("pnikolic");
    expect((assistent as HTMLSelectElement).value).toBe("mmarkovic");
  });

  it("lar assistenten fjernes med det tomme valget", async () => {
    const { assistent } = await åpneEditoren();

    fireEvent.change(assistent, { target: { value: "" } });

    expect((assistent as HTMLSelectElement).value).toBe("");
  });

  /**
   * Den ene kan ikke også være den andre. Serveren avviser det med 400, og listene her
   * utelater hverandres valg så det ikke er mulig å be om.
   */
  it("tilbyr ikke den valgte foreleseren som assistent", async () => {
    const { assistent } = await åpneEditoren();

    const valg = Array.from(assistent.querySelectorAll("option")).map((o) => o.value);

    expect(valg).not.toContain("pnikolic");
    expect(valg).toContain("jjovic");
  });

  /**
   * Den lagrede foreleseren må stå i listen selv om vedkommende ikke er på staben
   * lenger - ellers ville select-en falt tilbake på første oppføring og en lagring
   * byttet ut foreleseren uten at noen ba om det.
   */
  it("holder den lagrede foreleseren valgbar selv om vedkommende er borte fra staben", async () => {
    hentStaben.mockResolvedValue([oppføring("jjovic")]);

    const { foreleser } = await åpneEditoren();

    expect((foreleser as HTMLSelectElement).value).toBe("pnikolic");
    expect(
      Array.from(foreleser.querySelectorAll("option")).map((o) => o.value)
    ).toContain("pnikolic");
  });

  it("lagrer valget og leser staben på nytt", async () => {
    const { foreleser, assistent } = await åpneEditoren();

    fireEvent.change(foreleser, { target: { value: "jjovic" } });
    fireEvent.change(assistent, { target: { value: "" } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() =>
      expect(lagreStab).toHaveBeenCalledWith("s-1", "jjovic", null)
    );

    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
  });

  it("legger tilbake det som sto der da redigeringen avbrytes", async () => {
    const { foreleser } = await åpneEditoren();

    fireEvent.change(foreleser, { target: { value: "jjovic" } });
    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
    expect(lagreStab).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() =>
      expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe(
        "pnikolic"
      )
    );
  });

  /**
   * En mislykket lagring lar editoren stå åpen med valget i behold, så brukeren kan
   * prøve igjen uten å finne fram til det på nytt.
   */
  it("blir stående åpen med en beskjed når lagringen feiler", async () => {
    lagreStab.mockRejectedValue(new Error("403"));

    const { foreleser } = await åpneEditoren();

    fireEvent.change(foreleser, { target: { value: "jjovic" } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    expect(await screen.findByText("Failed to save changes.")).toBeDefined();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("jjovic");
  });

  it("sier fra når staben ikke kunne hentes", async () => {
    hentStaben.mockRejectedValue(new Error("401"));

    await åpneEditoren();

    expect(await screen.findByText("Unable to fetch lecturer list.")).toBeDefined();
  });
});
