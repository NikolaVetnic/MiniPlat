import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../test/http";
import type { LecturerSummary } from "../types/api";
import { fetchLecturers } from "../services/lecturersService";
import { useLecturers } from "./useLecturers";

vi.mock("../services/lecturersService", () => ({
  fetchLecturers: vi.fn(),
}));

const fetchRoster = vi.mocked(fetchLecturers);

const roster: LecturerSummary[] = [
  { username: "pnikolic", title: "dr", firstName: "Petar", lastName: "Nikolic" },
  { username: "mmarkovic", title: "MA", firstName: "Milica", lastName: "Markovic" },
];

beforeEach(() => {
  fetchRoster.mockReset();

  // The hook logs the failure before it shows a message. Useful in the browser, noise here.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLecturers", () => {
  it("fetches the roster and hands it on", async () => {
    fetchRoster.mockResolvedValue(roster);

    const { result } = renderHook(() => useLecturers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lecturers).toEqual(roster);
    expect(result.current.error).toBeNull();
  });

  it("reports itself busy while the request is out", async () => {
    const response = deferred<LecturerSummary[]>();
    fetchRoster.mockReturnValue(response.promise);

    const { result } = renderHook(() => useLecturers());

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.lecturers).toEqual([]);

    response.resolve(roster);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  /**
   * The dropdowns exist only in edit mode. Without the switch every subject card on the
   * page would ask for the roster on its first render, long before anyone opens an editor.
   */
  it("asks for nothing until it is switched on", () => {
    const { result } = renderHook(() => useLecturers(false));

    expect(fetchRoster).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.lecturers).toEqual([]);
  });

  it("fetches once it is switched on", async () => {
    fetchRoster.mockResolvedValue(roster);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useLecturers(enabled),
      { initialProps: { enabled: false } }
    );

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.lecturers).toEqual(roster));
    expect(fetchRoster).toHaveBeenCalledTimes(1);
  });

  it("does not fetch again when the editor re-renders", async () => {
    fetchRoster.mockResolvedValue(roster);

    const { result, rerender } = renderHook(() => useLecturers(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    rerender();

    expect(fetchRoster).toHaveBeenCalledTimes(1);
  });

  it("shows a message when the roster cannot be fetched", async () => {
    fetchRoster.mockRejectedValue(new Error("the network dropped"));

    const { result } = renderHook(() => useLecturers());

    await waitFor(() =>
      expect(result.current.error).toBe("Unable to fetch lecturer list.")
    );

    expect(result.current.lecturers).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  /**
   * The editor can be closed and opened again while the first request is still out. If
   * that answer comes back last it must not land on top of the newer one - the effect's
   * cleanup marks it abandoned, and that is the guard this exercises.
   */
  it("leaves an abandoned answer where it is once a newer one has arrived", async () => {
    const first = deferred<LecturerSummary[]>();
    const second = deferred<LecturerSummary[]>();

    fetchRoster.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useLecturers(enabled),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });
    rerender({ enabled: true });

    second.resolve(roster);
    await waitFor(() => expect(result.current.lecturers).toEqual(roster));

    // act() lets the .then chain and the state update it would have caused run to
    // completion, so the assertion below says something about what actually happened
    // rather than about timing.
    await act(async () => {
      first.resolve([]);
      await first.promise;
    });

    expect(result.current.lecturers).toEqual(roster);
  });
});
