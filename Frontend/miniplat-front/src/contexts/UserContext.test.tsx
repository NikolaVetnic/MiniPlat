import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Økten leses fra localStorage når session-modulen evalueres, altså ved sidelast i den
 * ekte appen. Testene må derfor seede lageret før modulene importeres, ikke etterpå.
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

const vist = () => screen.getByRole("status").textContent;

beforeEach(() => {
  localStorage.clear();
});

describe("UserProvider", () => {
  it("starter tom når ingenting er lagret", async () => {
    const { Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(vist()).toBe(
      JSON.stringify({ username: null, token: null, isAuthenticated: false })
    );
  });

  it("viser en lagret økt allerede på første render", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(vist()).toBe(
      JSON.stringify({
        username: "pnikolic",
        token: "abc123",
        isAuthenticated: true,
      })
    );
  });

  it("monterer uten å kaste når lagret bruker er korrupt", async () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{ikke json");

    const { Probe, UserProvider } = await load();

    expect(() =>
      render(
        <UserProvider>
          <Probe />
        </UserProvider>
      )
    ).not.toThrow();
  });

  it("følger med når tjenestelaget dropper økten utenfor komponenttreet", async () => {
    // Kjernen i 401-håndteringen: services kaller clearSession fra utenfor React, og
    // UI-et må slutte å si innlogget uten at noen komponent rører state selv.
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    const { clearSession, Probe, UserProvider } = await load();

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(vist()).toContain("pnikolic");

    act(() => {
      clearSession();
    });

    expect(vist()).toBe(
      JSON.stringify({ username: null, token: null, isAuthenticated: false })
    );
  });
});

describe("useUser", () => {
  it("kaster med en forklarende melding utenfor en provider", async () => {
    const { Probe } = await load();

    // React logger feilen selv; demp den så testutskriften holder seg lesbar.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/within a UserProvider/);

    spy.mockRestore();
  });
});
