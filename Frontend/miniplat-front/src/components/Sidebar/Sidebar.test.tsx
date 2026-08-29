import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject } from "../../test/fixtures";
import { loggInn, loggUt, renderMedØkt } from "../../test/render";
import { Level } from "../../types/api";
import { groupLabel } from "./grouping";
import sr from "../../locales/sr.json";
import Sidebar from "./Sidebar";

const cpt = sr.components.sidebar;

// NavItem nummererer teksten - «1 Psihologija» - så emnetitler søkes opp med regex.

/** Satt i vite.config.ts, så regelen er den samme her som i CI. */
const ADMIN = "mp_admin";

const LAGERNØKKEL = "sidebarExpandedGroups";

const emner = [
  makeSubject({
    id: "s-1",
    title: "Psihologija",
    lecturer: "pnikolic",
    assistant: null,
    level: Level.Undergraduate,
    semester: 1,
  }),
  makeSubject({
    id: "s-2",
    title: "Pedagogija",
    lecturer: "mmarkovic",
    assistant: "pnikolic",
    level: Level.Undergraduate,
    semester: 1,
  }),
  makeSubject({
    id: "s-3",
    title: "Metodika",
    lecturer: "jjovic",
    assistant: null,
    level: Level.Master,
    semester: 3,
  }),
];

const førsteGruppe = groupLabel("1-1", cpt);
const andreGruppe = groupLabel("2-3", cpt);

const vis = (props: Parameters<typeof Sidebar>[0] = {}) =>
  renderMedØkt(<Sidebar {...props} />);

beforeEach(() => {
  loggUt();
  localStorage.removeItem(LAGERNØKKEL);
});

afterEach(() => {
  loggUt();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  it("viser en spinner i stedet for treet mens emnene lastes", () => {
    vis({ subjects: emner, loading: true });

    expect(screen.queryByText(førsteGruppe)).toBeNull();
  });

  it("grupperer emnene på nivå og semester", () => {
    vis({ subjects: emner });

    expect(screen.getByText(førsteGruppe)).toBeDefined();
    expect(screen.getByText(andreGruppe)).toBeDefined();
  });

  /** Gruppene starter lukket, så en lang liste ikke ruller ut ved første besøk. */
  it("starter med gruppene lukket", () => {
    vis({ subjects: emner });

    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });

  it("åpner en gruppe når den klikkes", () => {
    vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Pedagogija/)).toBeDefined();
    expect(screen.queryByText(/Metodika/)).toBeNull();
  });

  it("lukker den igjen ved neste klikk", () => {
    vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));
    fireEvent.click(screen.getByText(førsteGruppe));

    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });

  /** Treet skal se ut som det gjorde, ellers må man klikke seg fram igjen hver navigering. */
  it("husker hvilke grupper som sto åpne", () => {
    const { unmount } = vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));
    unmount();

    vis({ subjects: emner });

    expect(screen.getByText(/Psihologija/)).toBeDefined();
  });

  it("tåler at det som er lagret ikke gir mening", () => {
    localStorage.setItem(LAGERNØKKEL, "ikke json");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    vis({ subjects: emner });

    expect(screen.getByText(førsteGruppe)).toBeDefined();
    expect(screen.queryByText(/Psihologija/)).toBeNull();
  });
});

describe("Sidebar og hvilke emner som vises", () => {
  it("viser alle aktive emner til en besøkende", () => {
    vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));
    fireEvent.click(screen.getByText(andreGruppe));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Metodika/)).toBeDefined();
  });

  /**
   * En innlogget nastavnik ser bare sine egne emner - som foreleser eller assistent.
   * Serveren avgjør det samme for skrivekallene; dette er navigasjonen som følger etter.
   */
  it("viser en foreleser bare emnene de har ansvar for", () => {
    loggInn("pnikolic");

    vis({ subjects: emner });

    expect(screen.getByText(førsteGruppe)).toBeDefined();
    expect(screen.queryByText(andreGruppe)).toBeNull();

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(screen.getByText(/Psihologija/)).toBeDefined();
    expect(screen.getByText(/Pedagogija/)).toBeDefined();
  });

  it("viser administratoren alt", () => {
    loggInn(ADMIN);

    vis({ subjects: emner });

    expect(screen.getByText(førsteGruppe)).toBeDefined();
    expect(screen.getByText(andreGruppe)).toBeDefined();
  });

  it("utelater emner som ikke er aktive", () => {
    vis({
      subjects: [
        makeSubject({ id: "s-1", title: "Aktivt", semester: 1, isActive: true }),
        makeSubject({ id: "s-2", title: "Inaktivt", semester: 1, isActive: false }),
      ],
    });

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(screen.getByText(/Aktivt/)).toBeDefined();
    expect(screen.queryByText(/Inaktivt/)).toBeNull();
  });

  it("viser ingen grupper når det ikke er noen emner", () => {
    vis({ subjects: [] });

    expect(screen.queryByText(førsteGruppe)).toBeNull();
    expect(screen.getByText(cpt.home)).toBeDefined();
  });
});

describe("Sidebar og lenkene", () => {
  it("peker på de offentlige adressene for en besøkende", () => {
    vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(
      screen.getByRole("link", { name: /Psihologija/ }).getAttribute("href")
    ).toBe("/subjects/s-1");
    expect(screen.getByRole("link", { name: cpt.home }).getAttribute("href")).toBe(
      "/home"
    );
  });

  it("peker på brukerens egne adresser når noen er logget inn", () => {
    loggInn("pnikolic");

    vis({ subjects: emner });

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(
      screen.getByRole("link", { name: /Psihologija/ }).getAttribute("href")
    ).toBe("/pnikolic/subjects/s-1");
    expect(screen.getByRole("link", { name: cpt.home }).getAttribute("href")).toBe(
      "/pnikolic/home"
    );
  });

  it("koder emne-id-en inn i adressen", () => {
    vis({
      subjects: [makeSubject({ id: "a b/c", title: "Rart", semester: 1 })],
    });

    fireEvent.click(screen.getByText(førsteGruppe));

    expect(screen.getByRole("link", { name: /Rart/ }).getAttribute("href")).toBe(
      "/subjects/a%20b%2Fc"
    );
  });
});
