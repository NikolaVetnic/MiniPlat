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
 * API_BASE_URL leses ved import, så miljøet må stå før modulen lastes. session lastes
 * i samme slengen fordi fetchUserInfo dropper økten gjennom den ved 401.
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

  it("veksler brukernavn og passord inn i et token", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    const result = await login("pnikolic", "hemmelig");

    expect(result).toEqual({
      token: "abc123",
      user: { username: "pnikolic" },
      expiresIn: 3600,
    });
  });

  it("poster mot token-endepunktet med passordflyten", async () => {
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
   * OpenIddict tar imot skjemakodede felter, ikke JSON. Sender vi JSON svarer det
   * invalid_request, og feilen ser ut som feil passord.
   */
  it("sender feltene skjemakodet og ikke som json", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    await login("pnikolic", "he mm&elig");

    const body = initOf(fetchMock).body as URLSearchParams;

    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get("grant_type")).toBe("password");
    expect(body.get("username")).toBe("pnikolic");
    expect(body.get("password")).toBe("he mm&elig");
  });

  it("legger aldri passordet i adressen", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();
    await login("pnikolic", "hemmelig");

    expect(urlOf(fetchMock)).not.toContain("hemmelig");
  });

  /**
   * Token-endepunktet svarer bare med OAuth2-feltene. Brukernavnet fra skjemaet er alt
   * økten trenger; resten av profilen kommer fra fetchUserInfo.
   */
  it("bygger brukeren av brukernavnet fra skjemaet", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login } = await load();

    expect((await login("mmarkovic", "hemmelig")).user).toEqual({
      username: "mmarkovic",
    });
  });

  it("gir null levetid når serveren ikke oppgir noen", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ access_token: "abc123", token_type: "Bearer" })
    );

    const { login } = await load();

    expect((await login("pnikolic", "hemmelig")).expiresIn).toBeNull();
  });

  /**
   * En levetid som ikke er et tall ville blitt Date.now() + NaN, altså et utløp som
   * aldri inntreffer - verre enn ikke å ha noe utløp i det hele tatt.
   */
  it.each([
    ["en streng", "3600"],
    ["uendelig", Number.POSITIVE_INFINITY],
    ["NaN", Number.NaN],
    ["null", null],
  ])("gir null levetid når serveren sender %s", async (_navn, expiresIn) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ access_token: "abc123", token_type: "Bearer", expires_in: expiresIn })
    );

    const { login } = await load();

    expect((await login("pnikolic", "hemmelig")).expiresIn).toBeNull();
  });

  it("løfter fram grunnen serveren oppga", async () => {
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

  it("faller tilbake til en generisk beskjed når svaret ikke er json", async () => {
    fetchMock.mockResolvedValue(textResponse("<html>502</html>", 502));

    const { login } = await load();

    await expect(login("pnikolic", "hemmelig")).rejects.toThrow("Login failed");
  });

  it("faller tilbake til en generisk beskjed når feilen ikke har noen beskrivelse", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400));

    const { login } = await load();

    await expect(login("pnikolic", "hemmelig")).rejects.toThrow("Login failed");
  });

  /**
   * Innloggingen er kallet som skaffer et token. Sender den et gammelt et, ville en
   * utløpt økt i lageret kunne forstyrre en ny innlogging.
   */
  it("sender ingen autorisasjonsheader", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login, storeSession } = await load();

    storeSession("gammelt-token", { username: "pnikolic" });
    await login("pnikolic", "hemmelig");

    expect(headersOf(fetchMock).Authorization).toBeUndefined();
  });

  it("rører ikke den lagrede økten - det gjør den som kalte den", async () => {
    fetchMock.mockResolvedValue(jsonResponse(tokenBody));

    const { login, getSession } = await load();
    await login("pnikolic", "hemmelig");

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("fetchUserInfo", () => {
  const profil = {
    sub: "1",
    username: "pnikolic",
    email: "pnikolic@example.com",
    firstName: "Petar",
    lastName: "Nikolic",
    title: "dr",
    department: "Psihologija",
  };

  it("henter profilen med tokenet den fikk", async () => {
    fetchMock.mockResolvedValue(jsonResponse(profil));

    const { fetchUserInfo } = await load();
    const result = await fetchUserInfo("abc123");

    expect(result).toEqual(profil);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Auth/UserInfo`);
    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });

  /**
   * Tokenet kommer som argument og ikke fra lageret, fordi innloggingen henter
   * profilen før den lagrer økten.
   */
  it("bruker tokenet den fikk, ikke det som ligger lagret", async () => {
    fetchMock.mockResolvedValue(jsonResponse(profil));

    const { fetchUserInfo, storeSession } = await load();

    storeSession("gammelt-token", { username: "noen" });
    await fetchUserInfo("nytt-token");

    expect(headersOf(fetchMock).Authorization).toBe("Bearer nytt-token");
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchUserInfo, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchUserInfo("abc123")).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("beholder økten når svaret er noe annet enn 401", async () => {
    fetchMock.mockResolvedValue(emptyResponse(500));

    const { fetchUserInfo, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchUserInfo("abc123")).rejects.toThrow();

    expect(getSession().token).toBe("abc123");
  });

  it("tar med status og kropp i feilen", async () => {
    fetchMock.mockResolvedValue(textResponse("noe gikk galt", 500));

    const { fetchUserInfo } = await load();

    await expect(fetchUserInfo("abc123")).rejects.toThrow(
      "Failed to fetch user info: 500 - noe gikk galt"
    );
  });
});
