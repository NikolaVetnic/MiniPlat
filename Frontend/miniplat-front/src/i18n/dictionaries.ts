import noJson from "../locales/no.json";
import srJson from "../locales/sr.json";
import type { Dictionary, Language } from "./types";

/**
 * The casts are what the explicit Dictionary type costs: TypeScript widens the guide
 * blocks in a JSON import to unions it cannot match against the declared one. The parity
 * that matters - that both files carry the same keys - is asserted in dictionaries.test.ts.
 */
export const dictionaries: Record<Language, Dictionary> = {
  sr: srJson as unknown as Dictionary,
  no: noJson as unknown as Dictionary,
};

/** Serbian, because that is what the institution the platform serves reads. */
export const DEFAULT_LANGUAGE: Language = "sr";

/** Offered by the picker, in the order it lists them. */
export const LANGUAGES: Language[] = ["sr", "no"];

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (LANGUAGES as string[]).includes(value);

/** Fills {name} placeholders; a key with no matching value is left as it stands. */
export const format = (
  template: string,
  values: Record<string, string>
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
