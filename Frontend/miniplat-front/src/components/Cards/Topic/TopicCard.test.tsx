import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMaterial, makeTopic } from "../../../test/fixtures";
import { loggInn, loggUt, renderMedØkt } from "../../../test/render";
import sr from "../../../locales/sr.json";
import TopicCard from "./TopicCard";
import type { Topic } from "../../../types/api";

const cpt = sr.components.cards.topic;

const handlers = () => ({
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onEdit: vi.fn(),
  onToggleVisibility: vi.fn(),
  onToggleDeletion: vi.fn(),
});

const vis = (
  topic: Topic,
  { index = 0, total = 1, ...rest }: { index?: number; total?: number } = {}
) => {
  const spies = handlers();

  renderMedØkt(
    <TopicCard topic={topic} index={index} total={total} {...spies} {...rest} />
  );

  return spies;
};

beforeEach(() => {
  loggUt();
});

afterEach(() => {
  loggUt();
});

describe("TopicCard, sett av en besøkende", () => {
  it("viser tittel, beskrivelse og materialer", () => {
    vis(
      makeTopic({
        title: "Prvo predavanje",
        description: "Uvod u temu",
        materials: [makeMaterial({ description: "Skripta" })],
      })
    );

    expect(screen.getByText("Prvo predavanje")).toBeDefined();
    expect(screen.getByText("Uvod u temu")).toBeDefined();
    expect(screen.getByText(/Skripta/)).toBeDefined();
  });

  /**
   * Knappene finnes ikke i treet i det hele tatt for en som ikke er logget inn - de er
   * ikke bare skjult med css, som ville latt dem klikkes fra konsollen.
   */
  it("har ingen redigeringsknapper", () => {
    vis(makeTopic(), { index: 1, total: 3 });

    expect(screen.queryByRole("button")).toBeNull();
  });

  /**
   * Statuslinjen forteller om et tema er skjult eller slettet. Serveren sender uansett
   * ingen skjulte temaer til en besøkende, men linjen hører til redigeringsvisningen.
   */
  it("har ingen statuslinje", () => {
    vis(makeTopic());

    expect(screen.queryByText(cpt.status.active)).toBeNull();
  });
});

describe("TopicCard, sett av en innlogget", () => {
  beforeEach(() => {
    loggInn();
  });

  it("viser knappene for å redigere, skjule og slette", () => {
    vis(makeTopic());

    expect(screen.getByRole("button", { name: cpt.buttons.edit })).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.hide })).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.delete })).toBeDefined();
  });

  /**
   * Pilene finnes bare der de har noe å gjøre: det øverste temaet kan ikke flyttes opp,
   * og det nederste ikke ned.
   */
  it.each([
    ["det første av tre", 0, 3, false, true],
    ["et i midten", 1, 3, true, true],
    ["det siste av tre", 2, 3, true, false],
    ["det eneste", 0, 1, false, false],
  ])("viser pilene som passer for %s", (_navn, index, total, opp, ned) => {
    vis(makeTopic(), { index, total });

    expect(screen.queryByRole("button", { name: "↑" }) !== null).toBe(opp);
    expect(screen.queryByRole("button", { name: "↓" }) !== null).toBe(ned);
  });

  it("melder fra om flytting med posisjonen sin", () => {
    const spies = vis(makeTopic(), { index: 1, total: 3 });

    fireEvent.click(screen.getByRole("button", { name: "↑" }));
    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    expect(spies.onMoveUp).toHaveBeenCalledWith(1);
    expect(spies.onMoveDown).toHaveBeenCalledWith(1);
  });

  it("melder fra om skjuling og sletting med tema-id-en", () => {
    const spies = vis(makeTopic({ id: "t-1" }));

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.hide }));
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.delete }));

    expect(spies.onToggleVisibility).toHaveBeenCalledWith("t-1");
    expect(spies.onToggleDeletion).toHaveBeenCalledWith("t-1");
  });

  /** Knappen sier hva den gjør nå, ikke hvilken tilstand temaet er i. */
  it.each([
    ["et synlig tema", false, cpt.buttons.hide],
    ["et skjult tema", true, cpt.buttons.show],
  ])("tilbyr %s riktig handling", (_navn, isHidden, tekst) => {
    vis(makeTopic({ isHidden }));

    expect(screen.getByRole("button", { name: tekst })).toBeDefined();
  });

  it.each([
    ["et levende tema", false, cpt.buttons.delete],
    ["et slettet tema", true, cpt.buttons.putBack],
  ])("tilbyr %s riktig handling", (_navn, isDeleted, tekst) => {
    vis(makeTopic({ isDeleted }));

    expect(screen.getByRole("button", { name: tekst })).toBeDefined();
  });

  it.each([
    ["aktiv", false, false, cpt.status.active],
    ["skjult", true, false, cpt.status.hidden],
    ["slettet", false, true, cpt.status.deleted],
    ["skjult og slettet", true, true, cpt.status.hiddenAndDeleted],
  ])("viser statusen %s", (_navn, isHidden, isDeleted, tekst) => {
    vis(makeTopic({ isHidden, isDeleted }));

    expect(screen.getByText(tekst)).toBeDefined();
  });
});

describe("TopicCard og materialene", () => {
  it("lenker til et materiale med en trygg adresse", () => {
    vis(
      makeTopic({
        materials: [
          makeMaterial({ description: "Skripta", link: "https://example.com/s.pdf" }),
        ],
      })
    );

    const lenke = screen.getByRole("link", { name: "https://example.com/s.pdf" });

    expect(lenke.getAttribute("href")).toBe("https://example.com/s.pdf");
    expect(lenke.getAttribute("rel")).toBe("noopener noreferrer");
    expect(lenke.getAttribute("target")).toBe("_blank");
  });

  /**
   * En foreleser kunne lagret en javascript-adresse. Den vises som tekst, ikke som noe
   * en student kan klikke - lenken finnes rett og slett ikke i treet.
   */
  it.each([
    ["javascript", "javascript:alert(1)"],
    ["data", "data:text/html,<script>alert(1)</script>"],
    ["file", "file:///etc/passwd"],
  ])("lenker ikke til en %s-adresse", (_navn, link) => {
    vis(makeTopic({ materials: [makeMaterial({ link })] }));

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(link)).toBeDefined();
  });

  it("viser ingen materialdel når temaet ikke har noen", () => {
    vis(makeTopic({ materials: [] }));

    expect(screen.queryByText(`${cpt.materials}:`)).toBeNull();
  });
});

describe("TopicCard og tidsstempelet", () => {
  it("viser når temaet sist ble endret", () => {
    vis(makeTopic({ lastModifiedAt: "2026-03-14T10:00:00.000Z" }));

    expect(screen.getByText(new RegExp(cpt.updatedAt))).toBeDefined();
  });

  /**
   * Uten tidsstempel droppes hele linjen. new Date(null) er epoken, og
   * "sist endret 1. januar 1970" ser ut som en ekte dato.
   */
  it("dropper linjen helt når tidsstempelet mangler", () => {
    vis(makeTopic({ lastModifiedAt: null }));

    expect(screen.queryByText(new RegExp(cpt.updatedAt))).toBeNull();
  });
});

describe("TopicCard og redigeringsvinduet", () => {
  beforeEach(() => {
    loggInn();
  });

  const åpne = () =>
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.edit }));

  it("åpner med temaets nåværende innhold", () => {
    vis(makeTopic({ title: "Prvo predavanje", description: "Uvod" }));

    åpne();

    expect(screen.getByDisplayValue("Prvo predavanje")).toBeDefined();
    expect(screen.getByDisplayValue("Uvod")).toBeDefined();
  });

  it("sender det redigerte temaet videre med id-en i behold", () => {
    const spies = vis(makeTopic({ id: "t-1", title: "Før" }));

    åpne();

    fireEvent.change(screen.getByDisplayValue("Før"), { target: { value: "Etter" } });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect(spies.onEdit).toHaveBeenCalledTimes(1);

    const sendt = spies.onEdit.mock.calls[0][0] as Topic;

    expect(sendt.id).toBe("t-1");
    expect(sendt.title).toBe("Etter");
  });

  it("stempler endringen med tidspunktet den ble gjort", () => {
    const spies = vis(makeTopic({ lastModifiedAt: "2020-01-01T00:00:00.000Z" }));

    åpne();
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    const sendt = spies.onEdit.mock.calls[0][0] as Topic;

    expect(sendt.lastModifiedAt).not.toBe("2020-01-01T00:00:00.000Z");
    expect(Date.parse(sendt.lastModifiedAt!)).toBeGreaterThan(0);
  });

  /**
   * Materialrader som ble stående helt tomme faller bort på veien ut, så et uhell i
   * skjemaet ikke blir en tom rad i emnet.
   */
  it("dropper materialrader som ble stående tomme", () => {
    const spies = vis(makeTopic({ materials: [] }));

    åpne();
    fireEvent.click(
      screen.getByRole("button", { name: cpt.buttons.addMaterial })
    );
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect((spies.onEdit.mock.calls[0][0] as Topic).materials).toEqual([]);
  });

  it("lukker vinduet uten å melde fra når redigeringen avbrytes", () => {
    const spies = vis(makeTopic());

    åpne();
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    expect(spies.onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: cpt.buttons.save })).toBeNull();
  });

  /**
   * Knappen leser feltene av temaet på nytt hver gang. Uten det ville vinduet vist det
   * som sto der forrige gang det var åpent, etter at emnet er lagret og lest på nytt.
   */
  it("henter innholdet på nytt hver gang det åpnes", () => {
    const spies = vis(makeTopic({ title: "Original" }));

    åpne();

    fireEvent.change(screen.getByDisplayValue("Original"), {
      target: { value: "Forkastet" },
    });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    åpne();

    expect(screen.getByDisplayValue("Original")).toBeDefined();
    expect(spies.onEdit).not.toHaveBeenCalled();
  });

  it("nekter å lagre et tema uten tittel", () => {
    const spies = vis(makeTopic({ title: "Har tittel" }));

    åpne();
    fireEvent.change(screen.getByDisplayValue("Har tittel"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

    expect(spies.onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: cpt.buttons.save })).toBeDefined();
  });
});
