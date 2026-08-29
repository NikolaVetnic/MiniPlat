import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFetch, jsonResponse, urlOf, type FetchMock } from "../test/http";

/**
 * Every service builds its addresses from VITE_API_BASE_URL, read once at import. .env is
 * gitignored, so how that variable is set is a per-deployment detail - and the two ways of
 * not setting it do not behave the same.
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

describe("the address the services call", () => {
  /**
   * Behind nginx this is the configuration: an empty value makes the calls relative to
   * the page itself, so they reach the same host that served it and CORS falls away.
   */
  it("is relative to the page when the value is empty", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe("/api/Subjects?pageIndex=0&pageSize=1000");
  });

  it("points at the host when there is one", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://localhost:4101");

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe(
      "https://localhost:4101/api/Subjects?pageIndex=0&pageSize=1000"
    );
  });

  /**
   * The trap .env.example warns about: the variable has to be present with an empty
   * value, not left out. A missing variable becomes undefined, and the interpolation
   * yields an address relative to a directory called "undefined" - which answers
   * index.html, not json.
   */
  it("is unusable when the variable is missing entirely", async () => {
    vi.stubEnv("VITE_API_BASE_URL", undefined);

    const { fetchSubjects } = await load();
    await fetchSubjects();

    expect(urlOf(fetchMock)).toBe("undefined/api/Subjects?pageIndex=0&pageSize=1000");
  });
});
