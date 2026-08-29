import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Guide from "./Guide";
import type { GuideBlock } from "./types";

describe("Guide", () => {
  it("renders each block kind as the markup the prose used to be written in", () => {
    const blocks: GuideBlock[] = [
      { kind: "h2", content: ["A heading"] },
      { kind: "h3", content: ["A subheading"] },
      {
        kind: "p",
        content: [
          "Plain ",
          { text: "bold", bold: true },
          " and ",
          { text: "italic", italic: true },
          " and ",
          { text: "badge", highlight: "#5cb85c" },
          ".",
        ],
      },
      { kind: "ul", items: [["First"], ["Second"]] },
      { kind: "video", videoId: "abc123", title: "A video" },
    ];

    const { container } = render(<Guide blocks={blocks} />);

    expect(screen.getByRole("heading", { level: 2, name: "A heading" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "A subheading" })).toBeDefined();
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("i")?.textContent).toBe("italic");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      container.querySelector("iframe")?.getAttribute("src")
    ).toContain("abc123");
  });

  it("keeps the whole paragraph together, markup and all", () => {
    const blocks: GuideBlock[] = [
      {
        kind: "p",
        content: ["Welcome to ", { text: "MiniPlat", bold: true }, ", the platform."],
      },
    ];

    const { container } = render(<Guide blocks={blocks} />);

    expect(container.querySelector("p")?.textContent).toBe(
      "Welcome to MiniPlat, the platform."
    );
  });

  it("renders nothing at all for an empty guide", () => {
    const { container } = render(<Guide blocks={[]} />);

    expect(container.querySelector("div")?.childElementCount).toBe(0);
  });
});
