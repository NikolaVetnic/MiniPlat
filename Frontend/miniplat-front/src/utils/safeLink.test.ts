import { describe, expect, it } from "vitest";

import { safeLink } from "./safeLink";

describe("safeLink", () => {
  it("lets http and https through unchanged", () => {
    expect(safeLink("https://example.com/skript.pdf")).toBe(
      "https://example.com/skript.pdf"
    );
    expect(safeLink("http://example.com")).toBe("http://example.com");
  });

  it("rejects the javascript scheme", () => {
    expect(safeLink("javascript:alert(1)")).toBeNull();
  });

  it("rejects javascript whatever the casing and leading whitespace", () => {
    // The URL parser normalises both, so a plain prefix check on the string would
    // have let these through.
    expect(safeLink("JavaScript:alert(1)")).toBeNull();
    expect(safeLink("  javascript:alert(1)")).toBeNull();
  });

  it("rejects schemes other than http and https", () => {
    expect(safeLink("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeLink("mailto:someone@example.com")).toBeNull();
    expect(safeLink("file:///etc/passwd")).toBeNull();
  });

  it("treats empty values as no link at all", () => {
    expect(safeLink("")).toBeNull();
    expect(safeLink(null)).toBeNull();
    expect(safeLink(undefined)).toBeNull();
  });

  it("keeps relative links, which resolve against the page's own origin", () => {
    expect(safeLink("/materijali/skripta.pdf")).toBe("/materijali/skripta.pdf");
  });

  it("lets text without a scheme through, because it resolves as a relative path", () => {
    // Current behaviour rather than a decision: a free-text string becomes a relative
    // link instead of being refused. Harmless, but worth having pinned.
    expect(safeLink("just some text")).toBe("just some text");
  });
});
