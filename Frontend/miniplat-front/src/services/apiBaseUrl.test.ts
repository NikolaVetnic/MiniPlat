import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFetch, jsonResponse, urlOf, type FetchMock } from "../test/http";

/**
 * Alle tjenestene bygger adressene sine av VITE_API_BASE_URL, lest én gang ved import.
 * .env er gitignorert, så hvordan den variabelen er satt er en oppsettsdetalj per
 * utplassering - og de to måtene å ikke sette den på oppfører seg ikke likt.
 */

let fetchMock: FetchMock;

const load = async () => {
  vi.resetModules();
  return import("./subjectsService");
};

beforeEach(() => {
  localStorage.clear();
  fetchMock = installFetch();
  fetchMock.mockResolvedValue(
    jsonResponse({ subjects: { pageIndex: 0, pageSize: 1000, count: 0, data: [] } })
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("adressen tjenestene kaller", () => {
  /**
   * Bak nginx er dette oppsettet: en tom verdi gjør kallene relative til siden selv, så
   * de treffer samme vert som leverte den, og CORS faller bort.
   */
  it("blir relativ til siden når verdien er tom", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe("/api/Subjects?pageIndex=0&pageSize=1000");
  });

  it("peker på verten når det står en der", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://localhost:4101");

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe(
      "https://localhost:4101/api/Subjects?pageIndex=0&pageSize=1000"
    );
  });

  /**
   * Fellen .env.example advarer mot: variabelen må stå med tom verdi, ikke utelates.
   * En manglende variabel blir undefined, og interpolasjonen gir en adresse relativ til
   * en katalog som heter "undefined" - som svarer index.html, ikke json.
   */
  it("blir ubrukelig når variabelen mangler helt", async () => {
    vi.stubEnv("VITE_API_BASE_URL", undefined);

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe("undefined/api/Subjects?pageIndex=0&pageSize=1000");
  });
});
