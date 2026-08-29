import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../test/http";
import type { LecturerDetails } from "../types/api";
import { fetchLecturer } from "../services/lecturersService";
import { useSubjectPeople } from "./useSubjectPeople";

vi.mock("../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
}));

const hentForeleser = vi.mocked(fetchLecturer);

const person = (username: string): LecturerDetails => ({
  username,
  title: "dr",
  firstName: "Fornavn",
  lastName: "Etternavn",
  department: "Psihologija",
  email: `${username}@example.com`,
});

const foreleser = person("pnikolic");
const assistent = person("mmarkovic");

beforeEach(() => {
  hentForeleser.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSubjectPeople", () => {
  it("henter foreleser og assistent samtidig", async () => {
    hentForeleser.mockImplementation(async (username) =>
      username === "pnikolic" ? foreleser : assistent
    );

    const { result } = renderHook(() => useSubjectPeople("pnikolic", "mmarkovic"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lecturer).toEqual(foreleser);
    expect(result.current.assistant).toEqual(assistent);
    expect(result.current.error).toBeNull();
  });

  /**
   * De fleste emner har ingen assistent. Å be om en tom streng ville blitt
   * /api/Lecturers/ - en helt annen rute, som svarer 401.
   */
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["tom streng", ""],
  ])("spør ikke etter en assistent som er %s", async (_navn, assistentnavn) => {
    hentForeleser.mockResolvedValue(foreleser);

    const { result } = renderHook(() =>
      useSubjectPeople("pnikolic", assistentnavn)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(hentForeleser).toHaveBeenCalledTimes(1);
    expect(hentForeleser).toHaveBeenCalledWith("pnikolic");
    expect(result.current.assistant).toBeNull();
  });

  it("spør ikke etter noen når emnet ikke har noen stab", async () => {
    const { result } = renderHook(() => useSubjectPeople(null, null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(hentForeleser).not.toHaveBeenCalled();
    expect(result.current.lecturer).toBeNull();
    expect(result.current.assistant).toBeNull();
  });

  it("er i gang fra første tegning", () => {
    hentForeleser.mockReturnValue(deferred<LecturerDetails | null>().promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    expect(result.current.loading).toBe(true);
  });

  it("viser en beskjed når oppslaget feiler", async () => {
    hentForeleser.mockRejectedValue(new Error("404"));

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    await waitFor(() =>
      expect(result.current.error).toBe("Unable to fetch lecturer information.")
    );

    expect(result.current.loading).toBe(false);
  });

  it("henter på nytt når emnet får en annen stab", async () => {
    hentForeleser.mockResolvedValue(foreleser);

    const { result, rerender } = renderHook(
      ({ navn }: { navn: string }) => useSubjectPeople(navn, null),
      { initialProps: { navn: "pnikolic" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    hentForeleser.mockResolvedValue(assistent);
    rerender({ navn: "mmarkovic" });

    await waitFor(() => expect(result.current.lecturer).toEqual(assistent));
  });

  it("henter ikke på nytt når kortet tegnes om med de samme navnene", async () => {
    hentForeleser.mockResolvedValue(foreleser);

    const { result, rerender } = renderHook(() =>
      useSubjectPeople("pnikolic", null)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    rerender();

    expect(hentForeleser).toHaveBeenCalledTimes(1);
  });

  it("laster om på forespørsel med nye navn", async () => {
    hentForeleser.mockResolvedValue(foreleser);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    hentForeleser.mockResolvedValue(assistent);
    await act(async () => {
      await result.current.refetch("mmarkovic", null);
    });

    expect(result.current.lecturer).toEqual(assistent);
  });

  /**
   * Etter at staben er lagret laster kortet om. Lykkes det, er den forrige feilen ikke
   * sann lenger, og beskjeden må forsvinne sammen med den.
   */
  it("fjerner en tidligere feil når oppslaget lykkes", async () => {
    hentForeleser.mockRejectedValue(new Error("404"));

    const { result } = renderHook(() => useSubjectPeople("ingen", null));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    hentForeleser.mockResolvedValue(foreleser);
    await act(async () => {
      await result.current.refetch("pnikolic", null);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.lecturer).toEqual(foreleser);
  });

  /**
   * Å lagre staben og laste om starter et nytt oppslag mens det første fortsatt står
   * ute. Kommer det gamle svaret tilbake sist, ville kortet vist forrige foreleser igjen
   * rett etter at brukeren nettopp byttet den - derav sekvensnummeret i kroken.
   */
  it("lar et utdatert svar ligge når et nyere allerede er kommet", async () => {
    const første = deferred<LecturerDetails | null>();
    const andre = deferred<LecturerDetails | null>();

    hentForeleser.mockReturnValueOnce(første.promise).mockReturnValueOnce(andre.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      andre.resolve(assistent);
      await andre.promise;
    });

    expect(result.current.lecturer).toEqual(assistent);

    await act(async () => {
      første.resolve(foreleser);
      await første.promise;
    });

    expect(result.current.lecturer).toEqual(assistent);
  });

  /**
   * Samme sekvensnummer styrer loading. Uten det ville det utdaterte svaret slått av
   * spinneren mens det nyere oppslaget fortsatt sto ute.
   */
  it("blir stående i gang til det nyeste oppslaget er ferdig", async () => {
    const første = deferred<LecturerDetails | null>();
    const andre = deferred<LecturerDetails | null>();

    hentForeleser.mockReturnValueOnce(første.promise).mockReturnValueOnce(andre.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      første.resolve(foreleser);
      await første.promise;
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      andre.resolve(assistent);
      await andre.promise;
    });

    expect(result.current.loading).toBe(false);
  });

  /**
   * En feil fra det utdaterte oppslaget må heller ikke vises: brukeren ser på resultatet
   * av det nyere, som gikk bra.
   */
  it("viser ikke en feil fra et utdatert oppslag", async () => {
    const første = deferred<LecturerDetails | null>();
    const andre = deferred<LecturerDetails | null>();

    hentForeleser.mockReturnValueOnce(første.promise).mockReturnValueOnce(andre.promise);

    const { result } = renderHook(() => useSubjectPeople("pnikolic", null));

    act(() => {
      void result.current.refetch("mmarkovic", null);
    });

    await act(async () => {
      andre.resolve(assistent);
      await andre.promise;
    });

    await act(async () => {
      første.reject(new Error("404"));
      await første.promise.catch(() => undefined);
    });

    expect(result.current.error).toBeNull();
  });
});
