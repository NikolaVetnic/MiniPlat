import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

import { Level, type Topic } from "../types/api";
import { makeMaterial, makeSubject, makeTopic } from "../test/fixtures";
import {
  formatSubjectsYaml,
  toYamlDocument,
  yamlFilename,
} from "./downloadYaml";

describe("toYamlDocument", () => {
  it("oversetter nivå fra tall til navn", () => {
    expect(
      toYamlDocument([makeSubject({ level: Level.Undergraduate })]).subjects[0]
        .level
    ).toBe("Undergraduate");

    expect(
      toYamlDocument([makeSubject({ level: Level.Master })]).subjects[0].level
    ).toBe("Master");
  });

  it("skriver tom streng når assistent mangler", () => {
    expect(
      toYamlDocument([makeSubject({ assistant: null })]).subjects[0].assistant
    ).toBe("");
  });

  it("tåler avkortede svar uten temaer eller materialer", () => {
    // Typene lover at listene finnes, så castet er med vilje: testen dekker
    // runtime-vaktene mot et svar som ikke holder det API-et lover.
    const doc = toYamlDocument([
      makeSubject({ topics: undefined as unknown as Topic[] }),
      makeSubject({
        id: "s2",
        topics: [makeTopic({ materials: undefined as unknown as never })],
      }),
    ]);

    expect(doc.subjects[0].topics).toEqual([]);
    expect(doc.subjects[1].topics[0].materials).toEqual([]);
  });

  it("tar bare med de feltene dumpen er ment å ha", () => {
    // Emnet fra API-et bærer også version, isDeleted og revisjonsfelter. De skal
    // ikke lekke ut i en fil som deles.
    const doc = toYamlDocument([makeSubject({ version: 42 })]);

    expect(Object.keys(doc.subjects[0]).sort()).toEqual([
      "assistant",
      "code",
      "description",
      "id",
      "isActive",
      "lecturer",
      "level",
      "semester",
      "title",
      "topics",
    ]);
  });

  it("beholder rekkefølgen på temaer og materialer", () => {
    const doc = toYamlDocument([
      makeSubject({
        topics: [
          makeTopic({
            materials: [
              makeMaterial({ id: "m1", order: 0 }),
              makeMaterial({ id: "m2", order: 1 }),
            ],
          }),
        ],
      }),
    ]);

    expect(doc.subjects[0].topics[0].materials.map((m) => m.id)).toEqual([
      "m1",
      "m2",
    ]);
  });
});

describe("formatSubjectsYaml", () => {
  it("produserer YAML som leser tilbake til samme dokument", () => {
    const subjects = [
      makeSubject(),
      makeSubject({ id: "s2", level: Level.Master }),
    ];

    expect(yaml.load(formatSubjectsYaml(subjects))).toEqual(
      toYamlDocument(subjects)
    );
  });

  it("bryter ikke lange lenker over flere linjer", () => {
    // lineWidth: -1. Uten den brekker js-yaml lange URL-er, og dumpen blir
    // ubrukelig til å kopiere lenker fra.
    const lang = `https://example.com/${"a".repeat(200)}.pdf`;
    const ut = formatSubjectsYaml([
      makeSubject({
        topics: [makeTopic({ materials: [makeMaterial({ link: lang })] })],
      }),
    ]);

    expect(ut).toContain(lang);
  });
});

describe("yamlFilename", () => {
  it("stempler filnavnet med tidspunkt uten tegn som er ulovlige i filnavn", () => {
    expect(yamlFilename(new Date("2026-08-29T13:45:07.123Z"))).toBe(
      "subjects_2026-08-29_13-45-07.yaml"
    );
  });
});
