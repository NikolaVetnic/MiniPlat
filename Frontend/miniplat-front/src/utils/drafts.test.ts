import { describe, expect, it } from "vitest";

import { makeMaterial } from "../test/fixtures";
import { newTopic, toMaterials } from "./drafts";

describe("toMaterials", () => {
  it("dropper rader brukeren lot stå helt tomme", () => {
    const ut = toMaterials([
      { description: "Skripta", link: "https://a" },
      { description: "   ", link: "  " },
      { description: "", link: "https://b" },
    ]);

    expect(ut.map((m) => m.link)).toEqual(["https://a", "https://b"]);
  });

  it("nummererer på nytt etter at tomme rader er fjernet", () => {
    const ut = toMaterials([
      { description: "a", link: "" },
      { description: "", link: "" },
      { description: "c", link: "" },
    ]);

    expect(ut.map((m) => m.order)).toEqual([0, 1]);
  });

  it("gir nye rader en id og beholder id-en på de som har en", () => {
    const ut = toMaterials([
      makeMaterial({ id: "beholdt" }),
      { description: "ny", link: "https://b" },
    ]);

    expect(ut[0].id).toBe("beholdt");
    expect(ut[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("beholder revisjonsfeltene på et materiale som allerede fantes", () => {
    const ut = toMaterials([
      makeMaterial({ createdBy: "pnikolic", createdAt: "2026-01-01T00:00:00Z" }),
    ]);

    expect(ut[0].createdBy).toBe("pnikolic");
    expect(ut[0].createdAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("newTopic", () => {
  it("bygger et tema som er komplett nok til å sendes", () => {
    const topic = newTopic("Naslov", "Opis", [], 3);

    expect(topic).toMatchObject({
      title: "Naslov",
      description: "Opis",
      order: 3,
      materials: [],
      isHidden: false,
      isDeleted: false,
      deletedAt: null,
    });
    expect(topic.id).toHaveLength(36);
    expect(Date.parse(topic.lastModifiedAt ?? "")).not.toBeNaN();
  });
});
