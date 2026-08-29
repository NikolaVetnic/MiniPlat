import { describe, expect, it } from "vitest";

import { safeLink } from "./safeLink";

describe("safeLink", () => {
  it("slipper gjennom http og https uendret", () => {
    expect(safeLink("https://example.com/skript.pdf")).toBe(
      "https://example.com/skript.pdf"
    );
    expect(safeLink("http://example.com")).toBe("http://example.com");
  });

  it("avviser javascript-skjemaet", () => {
    expect(safeLink("javascript:alert(1)")).toBeNull();
  });

  it("avviser javascript uansett bokstavstørrelse og innledende blanktegn", () => {
    // URL-parseren normaliserer begge deler, så en enkel prefiks-sjekk på strengen
    // ville sluppet disse gjennom.
    expect(safeLink("JavaScript:alert(1)")).toBeNull();
    expect(safeLink("  javascript:alert(1)")).toBeNull();
  });

  it("avviser andre skjemaer enn http og https", () => {
    expect(safeLink("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeLink("mailto:noen@example.com")).toBeNull();
    expect(safeLink("file:///etc/passwd")).toBeNull();
  });

  it("behandler tomme verdier som ingen lenke", () => {
    expect(safeLink("")).toBeNull();
    expect(safeLink(null)).toBeNull();
    expect(safeLink(undefined)).toBeNull();
  });

  it("beholder relative lenker, som løses mot sidens origin", () => {
    expect(safeLink("/materijali/skripta.pdf")).toBe("/materijali/skripta.pdf");
  });

  it("slipper gjennom tekst uten skjema, fordi den løses som relativ sti", () => {
    // Dagens adferd, ikke nødvendigvis ønsket: en fritekststreng blir en relativ
    // lenke i stedet for å avvises. Ufarlig, men verdt å ha låst.
    expect(safeLink("bare litt tekst")).toBe("bare litt tekst");
  });
});
