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
 * lecturersService holds the in-flight roster request in a module variable, so the module
 * has to be loaded again per test - otherwise one test inherits the previous one's cache.
 */
const load = async () => {
  vi.resetModules();

  const session = await import("./session");
  const lecturers = await import("./lecturersService");

  return { ...session, ...lecturers };
};

const details = {
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
  it("fetches one lecturer by username", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: details }));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("pnikolic")).toEqual(details);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Lecturers/pnikolic`);
  });

  /**
   * This used to be `|| []`: an empty array standing in for a missing object, which then
   * read as present everywhere downstream because [] is truthy.
   */
  it("gives null when the answer carries no lecturer", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("ingen")).toBeNull();
  });

  it("gives null when the lecturer in the answer is null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: null }));

    const { fetchLecturer } = await load();

    expect(await fetchLecturer("ingen")).toBeNull();
  });

  /**
   * A username is free text from Identity. Interpolated raw, a slash or a question mark
   * would change which route is called rather than which lecturer is asked for.
   */
  it.each([
    ["a slash", "pn/../Subjects", "pn%2F..%2FSubjects"],
    ["a question mark", "pn?x=1", "pn%3Fx%3D1"],
    ["a space", "petar nikolic", "petar%20nikolic"],
    ["an accented letter", "pnikolić", "pnikoli%C4%87"],
  ])("encodes %s in the username", async (_name, username, encoded) => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: details }));

    const { fetchLecturer } = await load();
    await fetchLecturer(username);

    expect(urlOf(fetchMock)).toBe(`${API}/api/Lecturers/${encoded}`);
  });

  /**
   * The profile is open, but the server uses the token to decide what to include - so the
   * header goes along when someone is signed in, and stays away otherwise.
   */
  it("sends the token when someone is signed in", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: details }));

    const { fetchLecturer, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchLecturer("pnikolic");

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });

  it("asks anonymously when nobody is signed in", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturer: details }));

    const { fetchLecturer } = await load();
    await fetchLecturer("pnikolic");

    expect(headersOf(fetchMock).Authorization).toBeUndefined();
  });

  it("throws with the status when the lecturer does not exist", async () => {
    fetchMock.mockResolvedValue(emptyResponse(404));

    const { fetchLecturer } = await load();

    await expect(fetchLecturer("ingen")).rejects.toThrow(
      "Failed to fetch lecturer: 404"
    );
  });

  it("drops the session when the server refuses the token", async () => {
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

  it("fetches the whole roster", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    expect(await fetchLecturers()).toEqual(roster);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Lecturers`);
  });

  it("gives an empty list when the answer carries no roster", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    const { fetchLecturers } = await load();

    expect(await fetchLecturers()).toEqual([]);
  });

  /**
   * Every subject card opened for editing asks for the roster. Without the shared promise
   * that is one request per card, all for the same unchanging list.
   */
  it("collapses concurrent calls into one request", async () => {
    const response = deferred<Response>();
    fetchMock.mockReturnValue(response.promise);

    const { fetchLecturers } = await load();

    const all = Promise.all([fetchLecturers(), fetchLecturers(), fetchLecturers()]);
    response.resolve(jsonResponse({ lecturers: roster }));

    expect(await all).toEqual([roster, roster, roster]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * Deliberate: the roster is the same for everyone and does not change while the page is
   * up. A newly registered lecturer appears only after the page is loaded again.
   */
  it("does not fetch again once the list has been fetched", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await fetchLecturers();
    await fetchLecturers();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * A failed call must not be cached as a result, or one network hiccup would leave the
   * lecturer dropdowns empty for the rest of the visit.
   */
  it("lets the next attempt try again after a failure", async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(500));
    fetchMock.mockResolvedValueOnce(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await expect(fetchLecturers()).rejects.toThrow("Failed to fetch lecturers: 500");
    expect(await fetchLecturers()).toEqual(roster);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lets the next attempt try again after the network dropped", async () => {
    fetchMock.mockRejectedValueOnce(new Error("the network dropped"));
    fetchMock.mockResolvedValueOnce(jsonResponse({ lecturers: roster }));

    const { fetchLecturers } = await load();

    await expect(fetchLecturers()).rejects.toThrow("the network dropped");
    expect(await fetchLecturers()).toEqual(roster);
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchLecturers, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchLecturers()).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("sends the token - the roster is closed to anonymous callers", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ lecturers: roster }));

    const { fetchLecturers, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchLecturers();

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });
});
