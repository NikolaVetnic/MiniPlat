import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useWindowWidth from "./useWindowWidth";

const opprinneligBredde = window.innerWidth;

const settBredde = (bredde: number) => {
  window.innerWidth = bredde;
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};

afterEach(() => {
  window.innerWidth = opprinneligBredde;
  vi.restoreAllMocks();
});

describe("useWindowWidth", () => {
  it("starter på bredden vinduet har", () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useWindowWidth());

    expect(result.current).toBe(1024);
  });

  /**
   * Sidebaren og emnekortene bytter oppsett på en breakpoint. Uten oppdateringen ville
   * de blitt stående i det oppsettet siden ble lastet i.
   */
  it("følger med når vinduet endrer størrelse", () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useWindowWidth());

    settBredde(480);
    expect(result.current).toBe(480);

    settBredde(1440);
    expect(result.current).toBe(1440);
  });

  it("lytter én gang uansett hvor mange ganger komponenten tegnes om", () => {
    const lytt = vi.spyOn(window, "addEventListener");

    const { rerender } = renderHook(() => useWindowWidth());

    rerender();
    rerender();

    expect(lytt.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
  });

  /**
   * Hvert emnekort bruker kroken. Uten opprydningen samler lytterne seg opp for hver
   * navigering, og alle blir kalt på hver eneste resize.
   */
  it("rydder opp etter seg", () => {
    const slutt = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useWindowWidth());

    unmount();

    expect(slutt.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
  });

  it("oppdaterer ikke lenger etter opprydningen", () => {
    window.innerWidth = 1024;

    const { result, unmount } = renderHook(() => useWindowWidth());

    unmount();
    settBredde(480);

    expect(result.current).toBe(1024);
  });
});
