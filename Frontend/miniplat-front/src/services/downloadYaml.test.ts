import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

import {
  formatSubjectsYaml,
  toYamlDocument,
  yamlFilename,
} from "./downloadYaml";

const subject = (over = {}) => ({
  id: "11111111-1111-1111-1111-111111111111",
  code: "PSI-101",
  title: "Psihologija",
  description: "Opis predmeta",
  level: 1,
  semester: 1,
  lecturer: "pnikolic",
  assistant: "mmarkovic",
  isActive: true,
  topics: [],
  ...over,
});

describe("toYamlDocument", () => {
  it("oversetter nivå fra tall til navn", () => {
    expect(toYamlDocument([subject({ level: 1 })]).subjects[0].level).toBe(
      "Undergraduate"
    );
    expect(toYamlDocument([subject({ level: 2 })]).subjects[0].level).toBe(
      "Master"
    );
  });

  it("skriver tom streng når assistent mangler", () => {
    expect(toYamlDocument([subject({ assistant: null })]).subjects[0].assistant).toBe("");
  });

  it("tåler emner uten temaer og temaer uten materialer", () => {
    const doc = toYamlDocument([
      subject({ topics: undefined }),
      subject({
        id: "s2",
        topics: [{ id: "t1", title: "Tema", description: "d", order: 0 }],
      }),
    ]);

    expect(doc.subjects[0].topics).toEqual([]);
    expect(doc.subjects[1].topics[0].materials).toEqual([]);
  });

  it("tar bare med de feltene dumpen er ment å ha", () => {
    // Emnet fra API-et bærer også version, isDeleted og revisjonsfelter. De skal
    // ikke lekke ut i en fil som deles.
    const doc = toYamlDocument([
      subject({ version: 42, isDeleted: false, createdBy: "admin" }),
    ]);

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
      subject({
        topics: [
          {
            id: "t1",
            title: "Tema",
            description: "d",
            order: 0,
            materials: [
              { id: "m1", description: "Skripta", link: "https://a", order: 0 },
              { id: "m2", description: "Vežbe", link: "https://b", order: 1 },
            ],
          },
        ],
      }),
    ]);

    expect(doc.subjects[0].topics[0].materials.map((m: { id: string }) => m.id)).toEqual([
      "m1",
      "m2",
    ]);
  });
});

describe("formatSubjectsYaml", () => {
  it("produserer YAML som leser tilbake til samme dokument", () => {
    const subjects = [subject(), subject({ id: "s2", level: 2 })];

    expect(yaml.load(formatSubjectsYaml(subjects))).toEqual(
      toYamlDocument(subjects)
    );
  });

  it("bryter ikke lange lenker over flere linjer", () => {
    // lineWidth: -1. Uten den brekker js-yaml lange URL-er, og dumpen blir
    // ubrukelig til å kopiere lenker fra.
    const lang = `https://example.com/${"a".repeat(200)}.pdf`;
    const ut = formatSubjectsYaml([
      subject({
        topics: [
          {
            id: "t1",
            title: "Tema",
            description: "d",
            order: 0,
            materials: [{ id: "m1", description: "d", link: lang, order: 0 }],
          },
        ],
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
