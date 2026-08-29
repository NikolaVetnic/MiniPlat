import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * session.js leser localStorage én gang ved import og speiler tokenet i en
 * modulvariabel. Hver test må derfor laste modulen på nytt, ellers henger den
 * in-memory kopien igjen fra forrige test.
 */
const loadSession = async () => {
  vi.resetModules();
  return import("./session");
};

beforeEach(() => {
  localStorage.clear();
});

describe("session", () => {
  it("gir tom økt når ingenting er lagret", async () => {
    const { getToken, readStoredSession } = await loadSession();

    expect(getToken()).toBeNull();
    expect(readStoredSession()).toEqual({ token: null, user: null });
  });

  it("leser en lagret økt tilbake ved oppstart", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { getToken, readStoredSession } = await loadSession();

    expect(getToken()).toBe("abc123");
    expect(readStoredSession()).toEqual({
      token: "abc123",
      user: { username: "pnikolic" },
    });
  });

  it("gjør tokenet lesbart synkront med én gang det lagres", async () => {
    const { getToken, storeSession } = await loadSession();

    storeSession("nytt-token", { username: "pnikolic" });

    // Poenget med modulvariabelen: authHeaders kaller getToken utenfor React og
    // må se tokenet uten å vente på en ny render.
    expect(getToken()).toBe("nytt-token");
    expect(localStorage.getItem("token")).toBe("nytt-token");
    expect(localStorage.getItem("user")).toBe('{"username":"pnikolic"}');
  });

  it("tømmer både lager og in-memory kopi ved utlogging", async () => {
    const { clearSession, getToken, storeSession } = await loadSession();

    storeSession("nytt-token", { username: "pnikolic" });
    clearSession();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("behandler korrupt brukerdata som ingen bruker i stedet for å kaste", async () => {
    // Var tidligere en krasj i UserProvider ved mount: JSON.parse lå utenfor
    // try/catch-en i read(). Tokenet beholdes, så leseendepunktene fortsetter å
    // svare med foreleserens utvidede innhold; brukeren framstår som utlogget.
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{ikke json");

    const { readStoredSession } = await loadSession();

    expect(readStoredSession()).toEqual({ token: "abc123", user: null });
  });

  it("avviser lagret bruker uten brukernavn", async () => {
    // Hver konsument leser user.username, så et objekt uten det feltet er ubrukelig
    // og skal ikke sendes videre til en render.
    localStorage.setItem("user", JSON.stringify({ epost: "a@b.c" }));

    const { readStoredSession } = await loadSession();

    expect(readStoredSession().user).toBeNull();
  });

  it("avviser lagret bruker som ikke er et objekt", async () => {
    localStorage.setItem("user", '"pnikolic"');

    const { readStoredSession } = await loadSession();

    expect(readStoredSession().user).toBeNull();
  });
});
