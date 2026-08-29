import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => {
  vi.useRealTimers();
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

  it("leser tokenet friskt, ikke fra kopien tatt ved import", async () => {
    // Modulen lastes med tomt lager, og tokenet skrives etterpå - slik en annen fane
    // ville gjort det. Speilet skal fange opp skrivingen, ikke bli hengende igjen.
    const { getToken, readStoredSession } = await loadSession();
    expect(getToken()).toBeNull();

    localStorage.setItem("token", "skrevet-senere");

    expect(readStoredSession().token).toBe("skrevet-senere");
    expect(getToken()).toBe("skrevet-senere");
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

describe("utløp", () => {
  it("beholder tokenet så lenge det er gyldig", async () => {
    const { getToken, storeSession } = await loadSession();

    storeSession("abc123", { username: "pnikolic" }, 3600);

    expect(getToken()).toBe("abc123");
  });

  it("dropper økten når tokenet er utløpt, uten å spørre serveren", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T12:00:00Z"));

    const { getToken, getSession, storeSession } = await loadSession();

    storeSession("abc123", { username: "pnikolic" }, 3600);
    vi.setSystemTime(new Date("2026-08-29T13:00:01Z"));

    expect(getToken()).toBeNull();
    // Ikke bare skjult: økten er faktisk ryddet bort, så UI-et slutter å si innlogget.
    expect(getSession()).toEqual({ token: null, user: null });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("lar en økt uten utløpstid stå", async () => {
    const { getToken, storeSession } = await loadSession();

    // Serveren oppga ingen expires_in. Da er det bare et 401 som kan avslutte økten.
    storeSession("abc123", { username: "pnikolic" });

    expect(getToken()).toBe("abc123");
  });
});

describe("abonnenter", () => {
  it("varsler ved innlogging og utlogging", async () => {
    const { clearSession, storeSession, subscribe } = await loadSession();
    const varsler = vi.fn();

    subscribe(varsler);

    storeSession("abc123", { username: "pnikolic" });
    expect(varsler).toHaveBeenCalledTimes(1);

    clearSession();
    expect(varsler).toHaveBeenCalledTimes(2);
  });

  it("varsler ikke når det ikke fantes noen økt å rydde", async () => {
    // Et 401 fra et endepunkt en anonym besøkende aldri var innlogget på skal ikke
    // presse en render gjennom hele treet.
    const { clearSession, subscribe } = await loadSession();
    const varsler = vi.fn();

    subscribe(varsler);
    clearSession();

    expect(varsler).not.toHaveBeenCalled();
  });

  it("slutter å varsle etter avmelding", async () => {
    const { storeSession, subscribe } = await loadSession();
    const varsler = vi.fn();

    subscribe(varsler)();
    storeSession("abc123", { username: "pnikolic" });

    expect(varsler).not.toHaveBeenCalled();
  });
});
