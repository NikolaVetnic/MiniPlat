import { describe, expect, it } from "vitest";

import { dictionaries, format, isLanguage, LANGUAGES } from "./dictionaries";

/**
 * The Dictionary type is declared by hand and the locale files reach it through a cast, so
 * the compiler cannot catch a key that exists in one language and not the other. This does:
 * it walks both files and compares the paths they carry.
 */
const paths = (value: unknown, prefix = ""): string[] => {
  if (Array.isArray(value))
    return [
      `${prefix}[${value.length}]`,
      ...value.flatMap((item, index) => paths(item, `${prefix}[${index}]`)),
    ];

  if (typeof value === "object" && value !== null)
    return Object.entries(value).flatMap(([key, item]) =>
      paths(item, `${prefix}.${key}`)
    );

  return [`${prefix}:${typeof value}`];
};

describe("dictionaries", () => {
  it("carries the same keys in every language", () => {
    const [first, ...rest] = LANGUAGES;
    const expected = paths(dictionaries[first]).sort();

    rest.forEach((language) => {
      expect(paths(dictionaries[language]).sort()).toEqual(expected);
    });
  });

  it("gives every language a name of its own", () => {
    const names = LANGUAGES.map((language) => dictionaries[language].languageName);

    expect(new Set(names).size).toBe(LANGUAGES.length);
  });

  it.each(LANGUAGES)("recognises %s as a language", (language) => {
    expect(isLanguage(language)).toBe(true);
  });

  it.each([["de"], ["sr-Latn"], [""], [null], [undefined], [42]])(
    "rejects %s",
    (value: unknown) => {
      expect(isLanguage(value)).toBe(false);
    }
  );
});

describe("format", () => {
  it("fills the placeholders it is given", () => {
    expect(format("{year} ({semester} semestar)", { year: "2", semester: "letnji" })).toBe(
      "2 (letnji semestar)"
    );
  });

  it("leaves a placeholder it has no value for alone", () => {
    expect(format("{year}. år", {})).toBe("{year}. år");
  });
});
