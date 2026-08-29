import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject, makeTopic } from "../../test/fixtures";
import { loggInn, loggUt } from "../../test/render";
import { UserProvider } from "../../contexts/UserContext";
import {
  ConflictError,
  fetchSubjects,
  updateSubjectTopics,
  updateTopicOrder,
  updateTopicState,
} from "../../services/subjectsService";
import { fetchLecturer, fetchLecturers } from "../../services/lecturersService";
import sr from "../../locales/sr.json";
import SubjectPage from "./SubjectPage";
import type { Subject } from "../../types/api";

// importActual beholder ConflictError som den ekte klassen, ellers ville instanceof
// i siden aldri slått til og konfliktbeskjeden vært utestbar.
vi.mock("../../services/subjectsService", async (importActual) => ({
  ...(await importActual<typeof import("../../services/subjectsService")>()),
  fetchSubjects: vi.fn(),
  updateSubjectTopics: vi.fn(),
  updateTopicOrder: vi.fn(),
  updateTopicState: vi.fn(),
}));

vi.mock("../../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
  fetchLecturers: vi.fn(),
}));

const hentEmner = vi.mocked(fetchSubjects);
const lagreTemaer = vi.mocked(updateSubjectTopics);
const lagreRekkefølge = vi.mocked(updateTopicOrder);
const lagreTemastatus = vi.mocked(updateTopicState);

const cpt = sr.pages.subject;
const temaCpt = sr.components.cards.topic;

const emne = (over: Partial<Subject> = {}) =>
  makeSubject({
    id: "s-1",
    title: "Psihologija",
    topics: [
      makeTopic({ id: "t-1", title: "Prva tema", order: 0 }),
      makeTopic({ id: "t-2", title: "Druga tema", order: 1 }),
    ],
    ...over,
  });

const vis = (subjectId = "s-1") =>
  render(
    <MemoryRouter initialEntries={[`/subjects/${subjectId}`]}>
      <UserProvider>
        <Routes>
          <Route
            path="/subjects/:subjectId"
            element={<SubjectPage onLogout={vi.fn()} />}
          />
          <Route path="/home" element={<div>hjemmesiden</div>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );

const visOgVent = async (subjectId = "s-1") => {
  const resultat = vis(subjectId);
  await screen.findByRole("heading", { level: 1 });
  return resultat;
};

beforeEach(() => {
  loggUt();
  vi.mocked(fetchLecturer).mockResolvedValue(null);
  vi.mocked(fetchLecturers).mockResolvedValue([]);

  hentEmner.mockReset().mockResolvedValue([emne()]);
  lagreTemaer.mockReset().mockResolvedValue(undefined);
  lagreRekkefølge.mockReset().mockResolvedValue(undefined);
  lagreTemastatus.mockReset().mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  loggUt();
  vi.restoreAllMocks();
});

describe("SubjectPage, det som vises", () => {
  it("viser emnet og temaene det har", async () => {
    await visOgVent();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Psihologija");
    expect(screen.getByText("Prva tema")).toBeDefined();
    expect(screen.getByText("Druga tema")).toBeDefined();
  });

  /**
   * En id som ikke er noe emne rendret før en tom side og kastet så på subject.title.
   * Nå havner man på hjemmesiden, samme behandling som en rute som ikke kan serveres.
   */
  it("sender deg til hjemmesiden når id-en ikke er noe emne", async () => {
    vis("finnes-ikke");

    expect(await screen.findByText("hjemmesiden")).toBeDefined();
  });

  it("sender deg til hjemmesiden når emnene ikke kunne hentes", async () => {
    hentEmner.mockRejectedValue(new Error("500"));

    vis();

    expect(await screen.findByText("hjemmesiden")).toBeDefined();
  });

  /**
   * Serveren sender uansett ingen skjulte temaer til en besøkende. Filteret her er det
   * samme skillet uttrykt i klienten, for det tilfellet at noe likevel kommer med.
   */
  it("skjuler skjulte og slettede temaer for en besøkende", async () => {
    hentEmner.mockResolvedValue([
      emne({
        topics: [
          makeTopic({ id: "t-1", title: "Synlig" }),
          makeTopic({ id: "t-2", title: "Skjult", isHidden: true }),
          makeTopic({ id: "t-3", title: "Slettet", isDeleted: true }),
        ],
      }),
    ]);

    await visOgVent();

    expect(screen.getByText("Synlig")).toBeDefined();
    expect(screen.queryByText("Skjult")).toBeNull();
    expect(screen.queryByText("Slettet")).toBeNull();
  });

  it("viser dem til en som er logget inn", async () => {
    loggInn();
    hentEmner.mockResolvedValue([
      emne({
        topics: [
          makeTopic({ id: "t-1", title: "Synlig" }),
          makeTopic({ id: "t-2", title: "Skjult", isHidden: true }),
        ],
      }),
    ]);

    await visOgVent();

    expect(screen.getByText("Skjult")).toBeDefined();
  });

  it("tilbyr ikke å legge til tema for en besøkende", async () => {
    await visOgVent();

    expect(screen.queryByRole("button", { name: cpt.buttons.addTopic })).toBeNull();
  });

  it("tilbyr det til en som er logget inn", async () => {
    loggInn();

    await visOgVent();

    expect(screen.getByRole("button", { name: cpt.buttons.addTopic })).toBeDefined();
  });
});

describe("SubjectPage og temaene", () => {
  beforeEach(() => {
    loggInn();
  });

  it("skjuler et tema gjennom sitt eget endepunkt", async () => {
    await visOgVent();

    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.hide })[0]);

    await waitFor(() =>
      expect(lagreTemastatus).toHaveBeenCalledWith("s-1", "t-1", { isHidden: true })
    );
    expect(lagreTemaer).not.toHaveBeenCalled();
  });

  it("markerer et tema for sletting gjennom det samme endepunktet", async () => {
    await visOgVent();

    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.delete })[0]);

    await waitFor(() =>
      expect(lagreTemastatus).toHaveBeenCalledWith("s-1", "t-1", { isDeleted: true })
    );
  });

  /** Flagget vendes: et skjult tema blir synlig igjen. */
  it("viser et skjult tema igjen", async () => {
    hentEmner.mockResolvedValue([
      emne({ topics: [makeTopic({ id: "t-1", title: "Skjult", isHidden: true })] }),
    ]);

    await visOgVent();

    fireEvent.click(screen.getByRole("button", { name: temaCpt.buttons.show }));

    await waitFor(() =>
      expect(lagreTemastatus).toHaveBeenCalledWith("s-1", "t-1", { isHidden: false })
    );
  });

  it("viser endringen med én gang, uten å vente på serveren", async () => {
    await visOgVent();

    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.hide })[0]);

    expect(screen.getAllByRole("button", { name: temaCpt.buttons.show })).toHaveLength(1);
  });

  /**
   * Bare rekkefølgen endret seg, så den går til sitt eget endepunkt i stedet for at
   * hele grafen sendes og serveren bygger hvert tema og materiale opp igjen.
   */
  it("flytter et tema gjennom rekkefølge-endepunktet", async () => {
    await visOgVent();

    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    await waitFor(() =>
      expect(lagreRekkefølge).toHaveBeenCalledWith("s-1", ["t-2", "t-1"])
    );
    expect(lagreTemaer).not.toHaveBeenCalled();
  });

  it("sender hele grafen når et tema redigeres", async () => {
    await visOgVent();

    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.edit })[0]);
    fireEvent.change(screen.getByDisplayValue("Prva tema"), {
      target: { value: "Endret" },
    });
    fireEvent.click(screen.getByRole("button", { name: temaCpt.buttons.save }));

    await waitFor(() => expect(lagreTemaer).toHaveBeenCalledTimes(1));

    const [, temaer] = lagreTemaer.mock.calls[0];

    expect(temaer.map((t) => t.title)).toEqual(["Endret", "Druga tema"]);
  });

  it("legger et nytt tema bakerst", async () => {
    await visOgVent();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.addTopic }));
    fireEvent.change(screen.getByLabelText(/Naslov/), {
      target: { value: "Treća tema" },
    });
    fireEvent.change(screen.getByLabelText(new RegExp(temaCpt.description)), {
      target: { value: "Opis teme" },
    });
    fireEvent.click(screen.getByRole("button", { name: temaCpt.buttons.save }));

    await waitFor(() => expect(lagreTemaer).toHaveBeenCalledTimes(1));

    const [, temaer] = lagreTemaer.mock.calls[0];

    expect(temaer.map((t) => t.title)).toEqual(["Prva tema", "Druga tema", "Treća tema"]);
  });
});

describe("SubjectPage når lagringen ikke går gjennom", () => {
  beforeEach(() => {
    loggInn();
  });

  const redigerFørsteTema = () => {
    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.edit })[0]);
    fireEvent.click(screen.getByRole("button", { name: temaCpt.buttons.save }));
  };

  /**
   * En konflikt er ikke det samme som en feil: noen andre lagret først, og brukeren må
   * hente den nye versjonen - ikke bare prøve igjen. Derfor sin egen beskjed.
   */
  it("sier fra om en konflikt med sin egen beskjed", async () => {
    lagreTemaer.mockRejectedValue(new ConflictError("s-1 was changed by someone else"));

    await visOgVent();
    redigerFørsteTema();

    const varsel = await screen.findByRole("alert");

    expect(varsel.textContent).toBe(cpt.saveConflict);
  });

  it("sier fra om en vanlig feil med den vanlige beskjeden", async () => {
    lagreTemaer.mockRejectedValue(new Error("500"));

    await visOgVent();
    redigerFørsteTema();

    const varsel = await screen.findByRole("alert");

    expect(varsel.textContent).toBe(cpt.saveFailed);
  });

  it("sier fra når en omrokkering ikke ble lagret", async () => {
    lagreRekkefølge.mockRejectedValue(new Error("400"));

    await visOgVent();
    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    expect((await screen.findByRole("alert")).textContent).toBe(cpt.saveFailed);
  });

  it("sier fra når et flagg ikke ble lagret", async () => {
    lagreTemastatus.mockRejectedValue(new Error("403"));

    await visOgVent();
    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.hide })[0]);

    expect((await screen.findByRole("alert")).textContent).toBe(cpt.saveFailed);
  });

  /** En ny handling nullstiller beskjeden, så den ikke blir stående etter at det gikk bra. */
  it("fjerner beskjeden når neste handling går gjennom", async () => {
    lagreTemastatus.mockRejectedValueOnce(new Error("403"));

    await visOgVent();
    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.hide })[0]);
    await screen.findByRole("alert");

    fireEvent.click(screen.getAllByRole("button", { name: temaCpt.buttons.delete })[0]);

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
