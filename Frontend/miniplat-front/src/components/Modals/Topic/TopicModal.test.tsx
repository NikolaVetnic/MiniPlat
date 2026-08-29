import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import sr from "../../../locales/sr.json";
import TopicModal from "./TopicModal";

const cpt = sr.components.cards.topic;
const feil = sr.components.modals.topic.errors;

const vis = (over: Partial<Parameters<typeof TopicModal>[0]> = {}) => {
  const spies = {
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onMaterialChange: vi.fn(),
    onAddMaterial: vi.fn(),
    onRemoveMaterial: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  const resultat = render(
    <TopicModal
      title="Prva tema"
      description="Opis teme"
      materials={[]}
      cpt={cpt}
      {...spies}
      {...over}
    />
  );

  return { ...spies, ...resultat };
};

const lagre = () =>
  fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

describe("TopicModal", () => {
  it("viser innholdet det ble åpnet med", () => {
    vis({ title: "Prva tema", description: "Opis teme" });

    expect(screen.getByDisplayValue("Prva tema")).toBeDefined();
    expect(screen.getByDisplayValue("Opis teme")).toBeDefined();
  });

  /** Overskriften sier om dette er en ny tema eller en som redigeres. */
  it.each([
    ["et nytt tema", "", cpt.titles.create],
    ["et som redigeres", "Prva tema", cpt.titles.update],
  ])("kaller vinduet for %s", (_navn, title, overskrift) => {
    vis({ title });

    expect(screen.getByRole("heading", { name: overskrift })).toBeDefined();
  });

  it("melder fra om hvert tastetrykk i tittelen", () => {
    const { onTitleChange } = vis();

    fireEvent.change(screen.getByLabelText(/Naslov/), { target: { value: "Ny" } });

    expect(onTitleChange).toHaveBeenCalledWith("Ny");
  });

  it("lagrer når begge feltene er fylt ut", () => {
    const { onSave } = vis();

    lagre();

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  /**
   * Et tema uten tittel eller beskrivelse ville blitt en tom rad i emnet. Vinduet blir
   * stående med feilen i stedet for å lukke seg og sende noe halvferdig videre.
   */
  it.each([
    ["tittelen", "", "Opis teme", feil.titleIsMandatory],
    ["beskrivelsen", "Prva tema", "", feil.descriptionIsMandatory],
    ["bare mellomrom i tittelen", "   ", "Opis teme", feil.titleIsMandatory],
  ])("nekter å lagre når %s mangler", (_navn, title, description, melding) => {
    const { onSave } = vis({ title, description });

    lagre();

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(melding)).toBeDefined();
  });

  it("melder om begge feltene når begge mangler", () => {
    vis({ title: "", description: "" });

    lagre();

    expect(screen.getByText(feil.titleIsMandatory)).toBeDefined();
    expect(screen.getByText(feil.descriptionIsMandatory)).toBeDefined();
  });

  /** Feilen forsvinner så snart feltet får innhold, ikke først ved neste lagring. */
  it("fjerner feilen når feltet fylles ut", () => {
    const { rerender } = vis({ title: "", description: "Opis teme" });

    lagre();
    expect(screen.getByText(feil.titleIsMandatory)).toBeDefined();

    rerender(
      <TopicModal
        title="Nå har den tittel"
        description="Opis teme"
        materials={[]}
        cpt={cpt}
        onTitleChange={vi.fn()}
        onDescriptionChange={vi.fn()}
        onMaterialChange={vi.fn()}
        onAddMaterial={vi.fn()}
        onRemoveMaterial={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText(feil.titleIsMandatory)).toBeNull();
  });

  it("avbryter uten å lagre", () => {
    const { onCancel, onSave } = vis();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("TopicModal og materialradene", () => {
  const materialer = [
    { description: "Skripta", link: "https://example.com/s.pdf" },
    { description: "Video", link: "https://example.com/v" },
  ];

  it("viser en rad per materiale", () => {
    vis({ materials: materialer });

    expect(screen.getByDisplayValue("Skripta")).toBeDefined();
    expect(screen.getByDisplayValue("https://example.com/v")).toBeDefined();
  });

  it("ber om en ny rad", () => {
    const { onAddMaterial } = vis();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.addMaterial }));

    expect(onAddMaterial).toHaveBeenCalledTimes(1);
  });

  it("melder fra om endringer med raden og feltet det gjelder", () => {
    const { onMaterialChange } = vis({ materials: materialer });

    fireEvent.change(screen.getByDisplayValue("Video"), { target: { value: "Snimak" } });

    expect(onMaterialChange).toHaveBeenCalledWith(1, "description", "Snimak");
  });

  it("melder fra om hvilken rad som skal fjernes", () => {
    const { onRemoveMaterial } = vis({ materials: materialer });

    const knapper = screen
      .getAllByRole("button")
      .filter((b) => b.textContent === "");

    fireEvent.click(knapper[1]);

    expect(onRemoveMaterial).toHaveBeenCalledWith(1);
  });
});
