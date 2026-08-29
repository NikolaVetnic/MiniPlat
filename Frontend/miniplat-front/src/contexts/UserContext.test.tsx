import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The session is read from localStorage when the session module is evaluated, which in
 * the real app is page load. Tests therefore have to seed storage before the modules are
 * imported, not after.
 */
const load = async () => {
  vi.resetModules();
  const session = await import("../services/session");
  const { UserProvider, useUser } = await import("./UserContext");

  const Probe = () => {
    const { user, token, isAuthenticated } = useUser();

    return (
      <output>
        {JSON.stringify({
          username: user?.username ?? null,
          token,
          isAuthenticated,
        })}
      </output>
    );
  };

  return { ...session, UserProvider, useUser, Probe };
};

const shown = () => screen.getByRole("status").textContent;

beforeEach(() => {
  localStorage.clear();
});

describe("UserProvider", () => {
  it("starts empty when nothing is stored", async () => {
    const { Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(shown()).toBe(
      JSON.stringify({ username: null, token: null, isAuthenticated: false })
    );
  });

  it("shows a stored session on the very first render", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(shown()).toBe(
      JSON.stringify({
        username: "pnikolic",
        token: "abc123",
        isAuthenticated: true,
      })
    );
  });

  it("mounts without throwing when the stored user is corrupt", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{not json");

    const { Probe, UserProvider } = await load();

    expect(() =>
      render(
        <UserProvider>
          <Probe />
        </UserProvider>
      )
    ).not.toThrow();
  });

  it("follows along when the services drop the session outside the tree", async () => {
    // The heart of the 401 handling: the services call clearSession from outside React,
    // and the UI has to stop claiming to be signed in without any component touching
    // state itself.
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { clearSession, Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(shown()).toContain("pnikolic");

    act(() => {
      clearSession();
    });

    expect(shown()).toBe(
      JSON.stringify({ username: null, token: null, isAuthenticated: false })
    );
  });
});

describe("useUser", () => {
  it("throws with an explanatory message outside a provider", async () => {
    const { Probe } = await load();

    // React logs the error itself; silence it so the test output stays readable.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/within a UserProvider/);

    spy.mockRestore();
  });
});
