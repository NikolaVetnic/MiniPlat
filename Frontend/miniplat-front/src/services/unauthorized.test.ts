import { beforeEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  const session = await import("./session");
  const { dropSessionIfRejected } = await import("./unauthorized");
  return { ...session, dropSessionIfRejected };
};

const response = (status: number) => new Response(null, { status });

beforeEach(() => {
  localStorage.clear();
});

describe("dropSessionIfRejected", () => {
  it("drops the session on 401", async () => {
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(response(401));

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("keeps the session on 403", async () => {
    // The API answers 403 for "you may only edit subjects you teach". That is a valid
    // session meeting an ownership rule, not a dead token.
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(response(403));

    expect(getSession().token).toBe("abc123");
  });

  it("leaves a session alone on 409 or 500", async () => {
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(response(409));
    dropSessionIfRejected(response(500));

    expect(getSession().token).toBe("abc123");
  });

  it("notifies nobody when an anonymous visitor gets a 401", async () => {
    const { dropSessionIfRejected, subscribe } = await load();
    const listener = vi.fn();

    subscribe(listener);
    dropSessionIfRejected(response(401));

    expect(listener).not.toHaveBeenCalled();
  });
});
