import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useWindowWidth from "./useWindowWidth";

const originalWidth = window.innerWidth;

const setWidth = (width: number) => {
  window.innerWidth = width;
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
};

afterEach(() => {
  window.innerWidth = originalWidth;
  vi.restoreAllMocks();
});

describe("useWindowWidth", () => {
  it("starts at the width the window has", () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useWindowWidth());

    expect(result.current).toBe(1024);
  });

  /**
   * The sidebar and the subject cards swap layout on a breakpoint. Without the update
   * they would stay in whatever layout the page was loaded at.
   */
  it("follows the window as it is resized", () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useWindowWidth());

    setWidth(480);
    expect(result.current).toBe(480);

    setWidth(1440);
    expect(result.current).toBe(1440);
  });

  it("listens once however many times the component re-renders", () => {
    const listen = vi.spyOn(window, "addEventListener");

    const { rerender } = renderHook(() => useWindowWidth());

    rerender();
    rerender();

    expect(listen.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
  });

  /**
   * Every subject card uses the hook. Without the cleanup the listeners accumulate with
   * each navigation, and all of them run on every resize.
   */
  it("cleans up after itself", () => {
    const stopListening = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useWindowWidth());

    unmount();

    expect(stopListening.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
  });

  it("stops updating once it has been cleaned up", () => {
    window.innerWidth = 1024;

    const { result, unmount } = renderHook(() => useWindowWidth());

    unmount();
    setWidth(480);

    expect(result.current).toBe(1024);
  });
});
