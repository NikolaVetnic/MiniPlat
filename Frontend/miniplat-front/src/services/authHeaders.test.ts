import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * authHeaders leser tokenet gjennom session, som holder en modulvariabel. Begge må
 * lastes på nytt sammen, ellers ser headeren en annen økt enn testen lagret.
 */
const load = async () => {
  vi.resetModules();

  const session = await import("./session");
  const { authHeaders } = await import("./authHeaders");

  return { ...session, authHeaders };
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("authHeaders", () => {
  it("sender ingen header når ingen er logget inn", async () => {
    const { authHeaders } = await load();

    expect(authHeaders()).toEqual({});
  });

  it("sender bearer-tokenet når noen er logget inn", async () => {
    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });

    expect(authHeaders()).toEqual({ Authorization: "Bearer abc123" });
  });

  /**
   * Leseendepunktene svarer et utløpt token med det offentlige synet i stedet for en
   * feil. Headeren faller derfor bort av seg selv, og siden viser det en besøkende
   * skal se - i stedet for å be om noe serveren uansett ikke gir.
   */
  it("faller tilbake til anonymt når tokenet er utløpt", async () => {
    vi.useFakeTimers();

    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" }, 60);
    vi.advanceTimersByTime(61_000);

    expect(authHeaders()).toEqual({});
  });

  it("sender tokenet så lenge det ennå er gyldig", async () => {
    vi.useFakeTimers();

    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" }, 60);
    vi.advanceTimersByTime(30_000);

    expect(authHeaders()).toEqual({ Authorization: "Bearer abc123" });
  });
});
