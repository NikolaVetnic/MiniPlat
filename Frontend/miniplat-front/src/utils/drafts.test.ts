import { describe, expect, it } from "vitest";

import { makeMaterial } from "../test/fixtures";
import { newTopic, toMaterials } from "./drafts";

describe("toMaterials", () => {
  it("drops the rows the user left entirely blank", () => {
    const materials = toMaterials([
      { description: "Skripta", link: "https://a" },
      { description: "   ", link: "  " },
      { description: "", link: "https://b" },
    ]);

    expect(materials.map((material) => material.link)).toEqual([
      "https://a",
      "https://b",
    ]);
  });

  it("renumbers what survives once the blank rows are gone", () => {
    const materials = toMaterials([
      { description: "a", link: "" },
      { description: "", link: "" },
      { description: "c", link: "" },
    ]);

    expect(materials.map((material) => material.order)).toEqual([0, 1]);
  });

  it("gives new rows an id and keeps the id of the ones that have one", () => {
    const materials = toMaterials([
      makeMaterial({ id: "kept" }),
      { description: "new", link: "https://b" },
    ]);

    expect(materials[0].id).toBe("kept");
    expect(materials[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("keeps the audit fields of a material that already existed", () => {
    const materials = toMaterials([
      makeMaterial({ createdBy: "pnikolic", createdAt: "2026-01-01T00:00:00Z" }),
    ]);

    expect(materials[0].createdBy).toBe("pnikolic");
    expect(materials[0].createdAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("newTopic", () => {
  it("builds a topic complete enough to be sent", () => {
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
