import { expect, vi } from "vitest";

/**
 * Felles rigg for tjenestetestene: en fetch-attrapp, og hjelpere for å lese ut hva
 * som faktisk ble sendt. Kun importert fra testfiler.
 */

export const API = "https://api.test";

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const textResponse = (body: string, status: number): Response =>
  new Response(body, { status });

export const emptyResponse = (status: number): Response =>
  new Response(null, { status });

export type FetchMock = ReturnType<typeof installFetch>;

export const installFetch = () => {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

  vi.stubGlobal("fetch", mock);

  return mock;
};

const callOf = (mock: FetchMock, index: number) => {
  const call = mock.mock.calls[index];

  expect(call, `fetch ble kalt ${mock.mock.calls.length} ganger`).toBeDefined();

  return call;
};

export const urlOf = (mock: FetchMock, index = 0): string => callOf(mock, index)[0];

export const initOf = (mock: FetchMock, index = 0): RequestInit =>
  callOf(mock, index)[1] ?? {};

export const headersOf = (mock: FetchMock, index = 0): Record<string, string> =>
  (initOf(mock, index).headers ?? {}) as Record<string, string>;

/** Kroppen slik den ble sendt, tolket tilbake fra JSON. */
export const bodyOf = <T,>(mock: FetchMock, index = 0): T =>
  JSON.parse(initOf(mock, index).body as string) as T;

/** Et løfte testen selv bestemmer når - og i hvilken rekkefølge - skal fullføres. */
export const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};
