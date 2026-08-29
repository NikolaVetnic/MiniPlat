import { beforeEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  const session = await import("./session");
  const { dropSessionIfRejected } = await import("./unauthorized");
  return { ...session, dropSessionIfRejected };
};

const svar = (status: number) => new Response(null, { status });

beforeEach(() => {
  localStorage.clear();
});

describe("dropSessionIfRejected", () => {
  it("dropper økten på 401", async () => {
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(svar(401));

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("beholder økten på 403", async () => {
    // API-et svarer 403 på «du kan bare redigere emner du underviser». Det er en
    // gyldig økt som møter en eierskapsregel, ikke en død token.
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(svar(403));

    expect(getSession().token).toBe("abc123");
  });

  it("rører ikke en økt på 409 eller 500", async () => {
    const { dropSessionIfRejected, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    dropSessionIfRejected(svar(409));
    dropSessionIfRejected(svar(500));

    expect(getSession().token).toBe("abc123");
  });

  it("varsler ikke når en anonym besøkende får 401", async () => {
    const { dropSessionIfRejected, subscribe } = await load();
    const varsler = vi.fn();

    subscribe(varsler);
    dropSessionIfRejected(svar(401));

    expect(varsler).not.toHaveBeenCalled();
  });
});
