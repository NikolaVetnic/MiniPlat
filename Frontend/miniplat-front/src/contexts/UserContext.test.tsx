import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "./UserContext";

const Probe = () => {
  const { user, token, isAuthenticated } = useUser();

  return (
    <output>
      {JSON.stringify({ username: user?.username ?? null, token, isAuthenticated })}
    </output>
  );
};

beforeEach(() => {
  localStorage.clear();
});

describe("UserProvider", () => {
  it("starter tom når ingenting er lagret", () => {
    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(screen.getByRole("status").textContent).toBe(
      JSON.stringify({ username: null, token: null, isAuthenticated: false })
    );
  });

  it("henter fram en lagret økt ved mount", () => {
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", JSON.stringify({ username: "pnikolic" }));

    render(
      <UserProvider>
        <Probe />
      </UserProvider>
    );

    expect(screen.getByRole("status").textContent).toBe(
      JSON.stringify({
        username: "pnikolic",
        token: "abc123",
        isAuthenticated: true,
      })
    );
  });

  it("monterer uten å kaste når lagret bruker er korrupt", () => {
    // Regresjonsvakt for krasjen som ble fikset i steg 2: dette veltet hele treet.
    localStorage.setItem("token", "abc123");
    localStorage.setItem("user", "{ikke json");

    expect(() =>
      render(
        <UserProvider>
          <Probe />
        </UserProvider>
      )
    ).not.toThrow();
  });
});

describe("useUser", () => {
  it("kaster med en forklarende melding utenfor en provider", () => {
    // React logger feilen selv; demp den så testutskriften holder seg lesbar.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/within a UserProvider/);

    spy.mockRestore();
  });
});
