import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../test/http";
import type { LecturerDetails } from "../types/api";
import { fetchLecturer } from "../services/lecturersService";
import { useSubjectPeople } from "./useSubjectPeople";

vi.mock("../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
}));

const fetchOne = vi.mocked(fetchLecturer);

const person = (username: string): LecturerDetails => ({
  username,
  title: "dr",
  firstName: "Ime",
  lastName: "Prezime",
  department: "Psihologija",
  email: `${username}@example.com`,
});

const lecturer = person("pnikolic");
const assistant = person("mmarkovic");

beforeEach(() => {
  fetchOne.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSubjectPeople", () => {
  it("fetches the lecturer and the assistant at once", async () => {
    fetchOne.mockImplementation(async (username) =>
      username === "pnikolic" ? lecturer : assistant
    );

    const { result } = renderHook(() => useSubjectPeople("pnikolic", "mmarkovic"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lecturer).toEqual(lecturer);
    expect(result.current.assistant).toEqual(assistant);
    expect(result.current.error).toBeNull();
  });

  /**
   * Most subjects have no assistant. Asking for an empty string would become
   * /api/Lecturers/ - an entirely different route, which answers 401.
   */
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
  ])("does not ask for an assistant that is %s", async (_name, assistantName) => {
    fetchOne.mockResolvedValue(lecturer);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", assistantName));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchOne).toHaveBeenCalledTimes(1);
    expect(fetchOne).toHaveBeenCalledWith("pnikolic");
    expect(result.current.assistant).toBeNull();
  });

  it("asks for nobody when the subject has no staff at all", async () => {
    const { result } = renderHook(() => useSubjectPeople(null, null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchOne).not.toHaveBeenCalled();
    expect(result.current.lecturer).toBeNull();
    expect(result.current.assistant).toBeNull();
  });

  it("reports itself busy from the very first render", () => {
    fetchOne.mockReturnValue(deferred<LecturerDetails | null>().promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    expect(result.current.loading).toBe(true);
  });

  it("shows a message when the lookup fails", async () => {
    fetchOne.mockRejectedValue(new Error("404"));

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    await waitFor(() =>
      expect(result.current.error).toBe("Unable to fetch lecturer information.")
    );

    expect(result.current.loading).toBe(false);
  });

  it("fetches again when the subject gets different staff", async () => {
    fetchOne.mockResolvedValue(lecturer);

    const { result, rerender } = renderHook(
      ({ name }: { name: string }) => useSubjectPeople(name, null),
      { initialProps: { name: "pnikolic" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchOne.mockResolvedValue(assistant);
    rerender({ name: "mmarkovic" });

    await waitFor(() => expect(result.current.lecturer).toEqual(assistant));
  });

  it("does not fetch again when the card re-renders with the same names", async () => {
    fetchOne.mockResolvedValue(lecturer);

    const { result, rerender } = renderHook(() => useSubjectPeople("pnikolic", null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    rerender();

    expect(fetchOne).toHaveBeenCalledTimes(1);
  });

  it("reloads on request with new names", async () => {
    fetchOne.mockResolvedValue(lecturer);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchOne.mockResolvedValue(assistant);
    await act(async () => {
      await result.current.refetch("mmarkovic", null);
    });

    expect(result.current.lecturer).toEqual(assistant);
  });

  /**
   * The card reloads once the staff has been saved. If that succeeds the previous failure
   * is no longer true, and the message has to go with it.
   */
  it("clears an earlier failure once the lookup succeeds", async () => {
    fetchOne.mockRejectedValue(new Error("404"));

    const { result } = renderHook(() => useSubjectPeople("nobody", null));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    fetchOne.mockResolvedValue(lecturer);
    await act(async () => {
      await result.current.refetch("pnikolic", null);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.lecturer).toEqual(lecturer);
  });

  /**
   * Saving the staff and reloading starts a second lookup while the first is still out.
   * If the old answer comes back last, the card would show the previous lecturer again
   * right after the user changed them - hence the sequence number in the hook.
   */
  it("leaves a stale answer where it is once a newer one has arrived", async () => {
    const first = deferred<LecturerDetails | null>();
    const second = deferred<LecturerDetails | null>();

    fetchOne.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      second.resolve(assistant);
      await second.promise;
    });

    expect(result.current.lecturer).toEqual(assistant);

    await act(async () => {
      first.resolve(lecturer);
      await first.promise;
    });

    expect(result.current.lecturer).toEqual(assistant);
  });

  /**
   * The same sequence number drives loading. Without it the stale answer would switch the
   * spinner off while the newer lookup was still out.
   */
  it("stays busy until the newest lookup has finished", async () => {
    const first = deferred<LecturerDetails | null>();
    const second = deferred<LecturerDetails | null>();

    fetchOne.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      first.resolve(lecturer);
      await first.promise;
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      second.resolve(assistant);
      await second.promise;
    });

    expect(result.current.loading).toBe(false);
  });

  /**
   * A failure from the stale lookup must not be shown either: the user is looking at the
   * result of the newer one, which went fine.
   */
  it("does not show a failure from a stale lookup", async () => {
    const first = deferred<LecturerDetails | null>();
    const second = deferred<LecturerDetails | null>();

    fetchOne.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      second.resolve(assistant);
      await second.promise;
    });

    await act(async () => {
      first.reject(new Error("404"));
      await first.promise.catch(() => undefined);
    });

    expect(result.current.error).toBeNull();
  });
});
