import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../test/http";
import type { LecturerSummary } from "../types/api";
import { fetchLecturers } from "../services/lecturersService";
import { useLecturers } from "./useLecturers";

vi.mock("../services/lecturersService", () => ({
  fetchLecturers: vi.fn(),
}));

const hentStaben = vi.mocked(fetchLecturers);

const roster: LecturerSummary[] = [
  { username: "pnikolic", title: "dr", firstName: "Petar", lastName: "Nikolic" },
  { username: "mmarkovic", title: "MA", firstName: "Milica", lastName: "Markovic" },
];

beforeEach(() => {
  hentStaben.mockReset();

  // Kroken logger feilen før den viser en beskjed. Nyttig i nettleseren, støy her.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLecturers", () => {
  it("henter staben og gir den videre", async () => {
    hentStaben.mockResolvedValue(roster);

    const { result } = renderHook(() => useLecturers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lecturers).toEqual(roster);
    expect(result.current.error).toBeNull();
  });

  it("er i gang mens kallet står ute", async () => {
    const svar = deferred<LecturerSummary[]>();
    hentStaben.mockReturnValue(svar.promise);

    const { result } = renderHook(() => useLecturers());

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.lecturers).toEqual([]);

    svar.resolve(roster);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  /**
   * Nedtrekkene finnes bare i redigeringsmodus. Uten bryteren ville hvert emnekort på
   * siden bedt om staben ved første tegning, lenge før noen åpner en editor.
   */
  it("ber ikke om noe før den er slått på", () => {
    const { result } = renderHook(() => useLecturers(false));

    expect(hentStaben).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.lecturers).toEqual([]);
  });

  it("henter når den slås på", async () => {
    hentStaben.mockResolvedValue(roster);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useLecturers(enabled),
      { initialProps: { enabled: false } }
    );

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.lecturers).toEqual(roster));
    expect(hentStaben).toHaveBeenCalledTimes(1);
  });

  it("henter ikke på nytt når editoren tegnes om", async () => {
    hentStaben.mockResolvedValue(roster);

    const { result, rerender } = renderHook(() => useLecturers(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    rerender();

    expect(hentStaben).toHaveBeenCalledTimes(1);
  });

  it("viser en beskjed når staben ikke kan hentes", async () => {
    hentStaben.mockRejectedValue(new Error("nettverket falt bort"));

    const { result } = renderHook(() => useLecturers());

    await waitFor(() =>
      expect(result.current.error).toBe("Unable to fetch lecturer list.")
    );

    expect(result.current.lecturers).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  /**
   * Editoren kan lukkes og åpnes igjen mens det første kallet fortsatt står ute. Kommer
   * det svaret tilbake sist, må det ikke legge seg over det nyere - opprydningen i
   * effekten merker det som forlatt, og det er den vakten dette prøver.
   */
  it("lar et forlatt svar ligge når et nyere allerede er kommet", async () => {
    const første = deferred<LecturerSummary[]>();
    const andre = deferred<LecturerSummary[]>();

    hentStaben.mockReturnValueOnce(første.promise).mockReturnValueOnce(andre.promise);

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useLecturers(enabled),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });
    rerender({ enabled: true });

    andre.resolve(roster);
    await waitFor(() => expect(result.current.lecturers).toEqual(roster));

    // act() lar .then-kjeden og tilstandsoppdateringen den ville utløst kjøre ferdig,
    // så påstanden under sier noe om hva som faktisk skjedde og ikke om timingen.
    await act(async () => {
      første.resolve([]);
      await første.promise;
    });

    expect(result.current.lecturers).toEqual(roster);
  });
});
