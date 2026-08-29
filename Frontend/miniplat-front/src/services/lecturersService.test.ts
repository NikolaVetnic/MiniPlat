import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API,
  deferred,
  emptyResponse,
  headersOf,
  installFetch,
  jsonResponse,
  urlOf,
  type FetchMock,
} from "../test/http";

let fetchMock: FetchMock;

/**
 * lecturersService holder det pågående roster-kallet i en modulvariabel, så modulen må
 * lastes på nytt for hver test - ellers arver neste test forrige tests mellomlager.
 */
const load = async () => {
  vi.resetModules();

  const session = await import("./session");
  const lecturers = await import("./lecturersService");

  return { ...session, ...lecturers };
};

const detaljer = {
  username: "pnikolic",
  title: "dr",
  firstName: "Petar",
  lastName: "Nikolic",
  department: "Psihologija",
  email: "pnikolic@example.com",
};

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_API_BASE_URL", API);
  fetchMock = installFetch();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchLecturer", () => {
  it("henter én foreleser på brukernavn", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: detaljer }));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("pnikolic")).toEqual(detaljer);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Lecturers/pnikolic`);
  });

  /**
   * Sto som `|| []` før: en tom liste i stedet for et manglende objekt, som så leste
   * som til stede overalt nedstrøms fordi [] er truthy.
   */
  it("gir null når svaret ikke har noen foreleser i seg", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("ingen")).toBeNull();
  });

  it("gir null når foreleseren i svaret er null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: null }));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("ingen")).toBeNull();
  });

  /**
   * Profilen er åpen, men serveren bruker tokenet til å avgjøre hva den tar med -
   * så headeren følger med når noen er logget inn, og uteblir ellers.
   */
  it("sender tokenet når noen er logget inn", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: detaljer }));

    const { fetchLecturer, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchLecturer("pnikolic");

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });

  it("spør anonymt når ingen er logget inn", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: detaljer }));

    const { fetchLecturer } = await load();
    await fetchLecturer("pnikolic");

    expect(headersOf(fetchMock).Authorization).toBeUndefined();
  });

  it("kaster med statusen når foreleseren ikke finnes", async () => {
    fetchMock.mockResolvedValue(emptyResponse(404));

    const { fetchLecturer } = await load();

    await expect(fetchLecturer("ingen")).rejects.toThrow(
      "Failed to fetch lecturer: 404"
    );
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchLecturer, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchLecturer("pnikolic")).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("fetchLecturers", () => {
  const roster = [
    { username: "pnikolic", title: "dr", firstName: "Petar", lastName: "Nikolic" },
    { username: "mmarkovic", title: "MA", firstName: "Milica", lastName: "Markovic" },
  ];

  it("henter hele staben", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    expect(await fetchLecturers()).toEqual(roster);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Lecturers`);
  });

  it("gir tom liste når svaret ikke har noen stab i seg", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    const { fetchLecturers } = await load();

    expect(await fetchLecturers()).toEqual([]);
  });

  /**
   * Hvert emnekort som åpnes for redigering ber om staben. Uten det delte løftet blir
   * det ett kall per kort, alle mot samme uforanderlige liste.
   */
  it("slår sammen kall som skjer samtidig til ett", async () => {
    const svar = deferred<Response>();
    fetchMock.mockReturnValue(svar.promise);

    const { fetchLecturers } = await load();

    const begge = Promise.all([fetchLecturers(), fetchLecturers(), fetchLecturers()]);
    svar.resolve(jsonResponse({ lecturers: roster }));

    expect(await begge).toEqual([roster, roster, roster]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * Bevisst: staben er den samme for alle og endrer seg ikke mens siden står oppe.
   * En nyregistrert foreleser dukker først opp etter en ny lasting av siden.
   */
  it("henter ikke på nytt når listen allerede er hentet", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await fetchLecturers();
    await fetchLecturers();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * Et mislykket kall må ikke mellomlagres som resultat, ellers hadde ett nettverksglipp
   * gjort forelesernedtrekkene tomme for resten av besøket.
   */
  it("lar neste forsøk gå på nytt etter en feil", async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(500));
    fetchMock.mockResolvedValueOnce(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await expect(fetchLecturers()).rejects.toThrow("Failed to fetch lecturers: 500");
    expect(await fetchLecturers()).toEqual(roster);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lar neste forsøk gå på nytt etter at nettverket falt bort", async () => {
    fetchMock.mockRejectedValueOnce(new Error("nettverket falt bort"));
    fetchMock.mockResolvedValueOnce(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await expect(fetchLecturers()).rejects.toThrow("nettverket falt bort");
    expect(await fetchLecturers()).toEqual(roster);
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchLecturers, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchLecturers()).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("sender tokenet - staben er stengt for anonyme", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchLecturers();

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });
});
