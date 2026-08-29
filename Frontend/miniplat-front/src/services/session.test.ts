import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * session.js reads localStorage once at import and mirrors the token in a module
 * variable. Every test therefore has to load the module again, or the in-memory copy
 * carries over from the previous one.
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
  it("gives an empty session when nothing is stored", async () => {
    const { getToken, readStoredSession } = await loadSession();

    expect(getToken()).toBeNull();
    expect(readStoredSession()).toEqual({ token: null, user: null });
  });

  it("reads a stored session back at startup", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { getToken, readStoredSession } = await loadSession();

    expect(getToken()).toBe("abc123");
    expect(readStoredSession()).toEqual({
      token: "abc123",
      user: { username: "pnikolic" },
    });
  });

  it("makes the token readable synchronously the moment it is stored", async () => {
    const { getToken, storeSession } = await loadSession();

    storeSession("new-token", { username: "pnikolic" });

    // The point of the module variable: authHeaders calls getToken outside React and
    // has to see the token without waiting for a render.
    expect(getToken()).toBe("new-token");
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(localStorage.getItem("user")).toBe('{"username":"pnikolic"}');
  });

  it("empties both storage and the in-memory copy on sign-out", async () => {
    const { clearSession, getToken, storeSession } = await loadSession();

    storeSession("new-token", { username: "pnikolic" });
    clearSession();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("treats corrupt user data as no user rather than throwing", async () => {
    // This used to crash UserProvider on mount: JSON.parse sat outside the try/catch in
    // read(). The token is kept, so the read endpoints keep answering with the
    // lecturer's extended content; the user simply appears signed out.
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{not json");

    const { readStoredSession } = await loadSession();

    expect(readStoredSession()).toEqual({ token: "abc123", user: null });
  });

  it("reads the token fresh rather than from the copy taken at import", async () => {
    // The module is loaded against empty storage and the token written afterwards, the
    // way another tab would. The mirror has to pick the write up, not lag behind it.
    const { getToken, readStoredSession } = await loadSession();
    expect(getToken()).toBeNull();

    localStorage.setItem("token", "written-later");

    expect(readStoredSession().token).toBe("written-later");
    expect(getToken()).toBe("written-later");
  });

  it("refuses a stored user without a username", async () => {
    // Every consumer reads user.username, so an object without that field is unusable
    // and must not be handed on to a render.
    localStorage.setItem("user", JSON.stringify({ email: "a@b.c" }));

    const { readStoredSession } = await loadSession();

    expect(readStoredSession().user).toBeNull();
  });

  it("refuses a stored user that is not an object", async () => {
    localStorage.setItem("user", '"pnikolic"');

    const { readStoredSession } = await loadSession();

    expect(readStoredSession().user).toBeNull();
  });
});

describe("session expiry", () => {
  it("keeps the token for as long as it is valid", async () => {
    const { getToken, storeSession } = await loadSession();

    storeSession("abc123", { username: "pnikolic" }, 3600);

    expect(getToken()).toBe("abc123");
  });

  it("drops the session once the token has expired, without asking the server", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T12:00:00Z"));

    const { getToken, getSession, storeSession } = await loadSession();

    storeSession("abc123", { username: "pnikolic" }, 3600);
    vi.setSystemTime(new Date("2026-08-29T13:00:01Z"));

    expect(getToken()).toBeNull();
    // Not merely hidden: the session is actually cleared, so the UI stops claiming to
    // be signed in.
    expect(getSession()).toEqual({ token: null, user: null });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("leaves a session without an expiry standing", async () => {
    const { getToken, storeSession } = await loadSession();

    // The server gave no expires_in. Only a 401 can end this session.
    storeSession("abc123", { username: "pnikolic" });

    expect(getToken()).toBe("abc123");
  });
});

describe("session subscribers", () => {
  it("notifies on sign-in and on sign-out", async () => {
    const { clearSession, storeSession, subscribe } = await loadSession();
    const listener = vi.fn();

    subscribe(listener);

    storeSession("abc123", { username: "pnikolic" });
    expect(listener).toHaveBeenCalledTimes(1);

    clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies nobody when there was no session to clear", async () => {
    // A 401 from an endpoint an anonymous visitor was never signed in for must not
    // push a render through the whole tree.
    const { clearSession, subscribe } = await loadSession();
    const listener = vi.fn();

    subscribe(listener);
    clearSession();

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying once unsubscribed", async () => {
    const { storeSession, subscribe } = await loadSession();
    const listener = vi.fn();

    subscribe(listener)();
    storeSession("abc123", { username: "pnikolic" });

    expect(listener).not.toHaveBeenCalled();
  });
});
