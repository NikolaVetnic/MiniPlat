import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * authHeaders reads the token through session, which keeps a module variable. Both have
 * to be loaded together, or the header sees a different session than the test stored.
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
  it("sends no header when nobody is signed in", async () => {
    const { authHeaders } = await load();

    expect(authHeaders()).toEqual({});
  });

  it("sends the bearer token when someone is signed in", async () => {
    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });

    expect(authHeaders()).toEqual({ Authorization: "Bearer abc123" });
  });

  /**
   * The read endpoints answer an expired token with the public view rather than an
   * error. The header therefore falls away on its own, and the page shows what a
   * visitor is meant to see - instead of asking for something the server will not give.
   */
  it("falls back to anonymous once the token has expired", async () => {
    vi.useFakeTimers();

    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" }, 60);
    vi.advanceTimersByTime(61_000);

    expect(authHeaders()).toEqual({});
  });

  it("sends the token for as long as it is still valid", async () => {
    vi.useFakeTimers();

    const { authHeaders, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" }, 60);
    vi.advanceTimersByTime(30_000);

    expect(authHeaders()).toEqual({ Authorization: "Bearer abc123" });
  });
});
