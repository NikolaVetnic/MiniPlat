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

  it("KJENT DEFEKT: korrupt brukerdata i localStorage kaster ved oppstart", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{ikke json");

    const { readStoredSession } = await loadSession();

    // JSON.parse ligger utenfor try/catch-en i read(), så dette velter UserProvider
    // ved mount. Testen dokumenterer dagens kontrakt; den skal snus til å returnere
    // en tom økt når session migreres i steg 2.
    expect(() => readStoredSession()).toThrow();
  });
});
