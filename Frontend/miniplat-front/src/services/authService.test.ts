import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API,
  emptyResponse,
  headersOf,
  initOf,
  installFetch,
  jsonResponse,
  textResponse,
  urlOf,
  type FetchMock,
} from "../test/http";

let fetchMock: FetchMock;

/**
 * API_BASE_URL is read at import, so the environment has to be in place before the module
 * loads. session comes along because fetchUserInfo drops the session through it on a 401.
 */
const load = async () => {
  vi.resetModules();

  const session = await import("./session");
  const auth = await import("./authService");

  return { ...session, ...auth };
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

describe("login", () => {
  const tokenBody = {
    access_token: "abc123",
    token_type: "Bearer",
    expires_in: 3600,
  };

  it("exchanges a username and password for a token", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    const result = await login("pnikolic", "hemmelig");

    expect(result).toEqual({
      token: "abc123",
      user: { username: "pnikolic" },
      expiresIn: 3600,
    });
  });

  it("posts to the token endpoint with the password flow", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    await login("pnikolic", "hemmelig");

    expect(urlOf(fetchMock)).toBe(`${API}/api/Auth/Token`);
    expect(initOf(fetchMock).method).toBe("POST");
    expect(headersOf(fetchMock)["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    );
  });

  /**
   * OpenIddict accepts form-encoded fields, not JSON. Sending JSON answers
   * invalid_request, and the failure looks exactly like a wrong password.
   */
  it("sends the fields form-encoded rather than as json", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    await login("pnikolic", "he mm&elig");

    const body = initOf(fetchMock).body as URLSearchParams;

    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get("grant_type")).toBe("password");
    expect(body.get("username")).toBe("pnikolic");
    expect(body.get("password")).toBe("he mm&elig");
  });

  it("never puts the password in the address", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    await login("pnikolic", "hemmelig");

    expect(urlOf(fetchMock)).not.toContain("hemmelig");
  });

  /**
   * The token endpoint answers with the OAuth2 fields only. The username from the form is
   * all the session needs; the rest of the profile comes from fetchUserInfo.
   */
  it("builds the user from the username on the form", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();

    expect((await login("mmarkovic", "hemmelig")).user).toEqual({
      username: "mmarkovic",
    });
  });

  it("reports no lifetime when the server does not give one", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ access_token: "abc123", token_type: "Bearer" })
    );

    const { login } = await load();

    expect((await login("pnikolic", "hemmelig")).expiresIn).toBeNull();
  });

  /**
   * A lifetime that is not a number would become Date.now() + NaN, an expiry that never
   * arrives - worse than having no expiry at all.
   */
  it.each([
    ["a string", "3600"],
    ["infinity", Number.POSITIVE_INFINITY],
    ["NaN", Number.NaN],
    ["null", null],
  ])("reports no lifetime when the server sends %s", async (_name, expiresIn) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ access_token: "abc123", token_type: "Bearer", expires_in: expiresIn })
    );

    const { login } = await load();

    expect((await login("pnikolic", "hemmelig")).expiresIn).toBeNull();
  });

  it("surfaces the reason the server gave", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: "invalid_grant", error_description: "Feil brukernavn eller passord." },
        400
      )
    );

    const { login } = await load();

    await expect(login("pnikolic", "feil")).rejects.toThrow(
      "Feil brukernavn eller passord."
    );
  });

  it("falls back to a generic message when the answer is not json", async () => {
    fetchMock.mockResolvedValue(textResponse("<html>502</html>", 502));

    const { login } = await load();

    await expect(login("pnikolic", "hemmelig")).rejects.toThrow("Login failed");
  });

  it("falls back to a generic message when the error carries no description", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400));

    const { login } = await load();

    await expect(login("pnikolic", "hemmelig")).rejects.toThrow("Login failed");
  });

  /**
   * Signing in is the call that obtains a token. Were it to send an old one, an expired
   * session in storage could interfere with a fresh sign-in.
   */
  it("sends no authorization header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login, storeSession } = await load();

    storeSession("gammelt-token", { username: "pnikolic" });
    await login("pnikolic", "hemmelig");

    expect(headersOf(fetchMock).Authorization).toBeUndefined();
  });

  it("leaves the stored session alone - that is up to the caller", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login, getSession } = await load();
    await login("pnikolic", "hemmelig");

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("fetchUserInfo", () => {
  const profile = {
    sub: "1",
    username: "pnikolic",
    email: "pnikolic@example.com",
    firstName: "Petar",
    lastName: "Nikolic",
    title: "dr",
    department: "Psihologija",
  };

  it("fetches the profile with the token it was handed", async () => {
    fetchMock.mockResolvedValue(jsonResponse(profile));

    const { fetchUserInfo } = await load();
    const result = await fetchUserInfo("abc123");

    expect(result).toEqual(profile);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Auth/UserInfo`);
    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });

  /**
   * The token arrives as an argument rather than from storage, because signing in fetches
   * the profile before it stores the session.
   */
  it("uses the token it was handed, not the one in storage", async () => {
    fetchMock.mockResolvedValue(jsonResponse(profile));

    const { fetchUserInfo, storeSession } = await load();

    storeSession("gammelt-token", { username: "noen" });
    await fetchUserInfo("nytt-token");

    expect(headersOf(fetchMock).Authorization).toBe("Bearer nytt-token");
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchUserInfo, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchUserInfo("abc123")).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("keeps the session when the answer is anything but 401", async () => {
    fetchMock.mockResolvedValue(emptyResponse(500));

    const { fetchUserInfo, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchUserInfo("abc123")).rejects.toThrow();

    expect(getSession().token).toBe("abc123");
  });

  it("carries the status and the body into the error", async () => {
    fetchMock.mockResolvedValue(textResponse("noe gikk galt", 500));

    const { fetchUserInfo } = await load();

    await expect(fetchUserInfo("abc123")).rejects.toThrow(
      "Failed to fetch user info: 500 - noe gikk galt"
    );
  });
});
