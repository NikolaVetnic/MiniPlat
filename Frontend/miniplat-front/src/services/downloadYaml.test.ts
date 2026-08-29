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
  it("translates the level from a number to a name", () => {
    expect(
      toYamlDocument([makeSubject({ level: Level.Undergraduate })]).subjects[0]
        .level
    ).toBe("Undergraduate");

    expect(
      toYamlDocument([makeSubject({ level: Level.Master })]).subjects[0].level
    ).toBe("Master");
  });

  it("writes an empty string when there is no assistant", () => {
    expect(
      toYamlDocument([makeSubject({ assistant: null })]).subjects[0].assistant
    ).toBe("");
  });

  it("tolerates truncated responses with no topics or materials", () => {
    // The types promise the lists are there, so the cast is deliberate: this covers
    // the runtime guards against a response that does not keep what the API promises.
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

  it("carries only the fields the dump is meant to have", () => {
    // The subject from the API also carries version, isDeleted and the audit fields.
    // None of that belongs in a file that gets shared.
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

  it("keeps the order of topics and materials", () => {
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
  it("produces YAML that reads back into the same document", () => {
    const subjects = [
      makeSubject(),
      makeSubject({ id: "s2", level: Level.Master }),
    ];

    expect(yaml.load(formatSubjectsYaml(subjects))).toEqual(
      toYamlDocument(subjects)
    );
  });

  it("does not wrap long links across lines", () => {
    // lineWidth: -1. Without it js-yaml breaks long URLs, and the dump becomes
    // useless for copying links out of.
    const long = `https://example.com/${"a".repeat(200)}.pdf`;
    const output = formatSubjectsYaml([
      makeSubject({
        topics: [makeTopic({ materials: [makeMaterial({ link: long })] })],
      }),
    ]);

    expect(output).toContain(long);
  });
});

describe("yamlFilename", () => {
  it("stamps the filename with a time that carries no character a filename may not", () => {
    expect(yamlFilename(new Date("2026-08-29T13:45:07.123Z"))).toBe(
      "subjects_2026-08-29_13-45-07.yaml"
    );
  });
});
