import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import sr from "../../../locales/sr.json";
import TopicModal from "./TopicModal";

const cpt = sr.components.cards.topic;
const errors = sr.components.modals.topic.errors;

const show = (over: Partial<Parameters<typeof TopicModal>[0]> = {}) => {
  const spies = {
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onMaterialChange: vi.fn(),
    onAddMaterial: vi.fn(),
    onRemoveMaterial: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  const rendered = render(
    <TopicModal
      title="Prva tema"
      description="Opis teme"
      materials={[]}
      cpt={cpt}
      {...spies}
      {...over}
    />
  );

  return { ...spies, ...rendered };
};

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: cpt.buttons.save }));

describe("TopicModal", () => {
  it("shows the content it was opened with", () => {
    show({ title: "Prva tema", description: "Opis teme" });

    expect(screen.getByDisplayValue("Prva tema")).toBeDefined();
    expect(screen.getByDisplayValue("Opis teme")).toBeDefined();
  });

  /** The heading says whether this is a new topic or one being edited. */
  it.each([
    ["a new topic", "", cpt.titles.create],
    ["one being edited", "Prva tema", cpt.titles.update],
  ])("names the dialog for %s", (_name, title, heading) => {
    show({ title });

    expect(screen.getByRole("heading", { name: heading })).toBeDefined();
  });

  it("reports every keystroke in the title", () => {
    const { onTitleChange } = show();

    fireEvent.change(screen.getByLabelText(/Naslov/), { target: { value: "Ny" } });

    expect(onTitleChange).toHaveBeenCalledWith("Ny");
  });

  it("saves once both fields are filled in", () => {
    const { onSave } = show();

    save();

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  /**
   * A topic with no title or description would become an empty row on the subject. The
   * dialog stays open with the error rather than closing and sending something half done.
   */
  it.each([
    ["the title", "", "Opis teme", errors.titleIsMandatory],
    ["the description", "Prva tema", "", errors.descriptionIsMandatory],
    ["nothing but spaces in the title", "   ", "Opis teme", errors.titleIsMandatory],
  ])("refuses to save when %s is missing", (_name, title, description, message) => {
    const { onSave } = show({ title, description });

    save();

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(message)).toBeDefined();
  });

  it("reports both fields when both are missing", () => {
    show({ title: "", description: "" });

    save();

    expect(screen.getByText(errors.titleIsMandatory)).toBeDefined();
    expect(screen.getByText(errors.descriptionIsMandatory)).toBeDefined();
  });

  /** The error goes as soon as the field has content, not at the next save. */
  it("clears the error once the field is filled in", () => {
    const { rerender } = show({ title: "", description: "Opis teme" });

    save();
    expect(screen.getByText(errors.titleIsMandatory)).toBeDefined();

    rerender(
      <TopicModal
        title="It has a title now"
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

    expect(screen.queryByText(errors.titleIsMandatory)).toBeNull();
  });

  it("cancels without saving", () => {
    const { onCancel, onSave } = show();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.cancel }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("TopicModal and the material rows", () => {
  const materials = [
    { description: "Skripta", link: "https://example.com/s.pdf" },
    { description: "Video", link: "https://example.com/v" },
  ];

  it("shows one row per material", () => {
    show({ materials });

    expect(screen.getByDisplayValue("Skripta")).toBeDefined();
    expect(screen.getByDisplayValue("https://example.com/v")).toBeDefined();
  });

  it("asks for a new row", () => {
    const { onAddMaterial } = show();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.addMaterial }));

    expect(onAddMaterial).toHaveBeenCalledTimes(1);
  });

  it("reports a change with the row and the field it concerns", () => {
    const { onMaterialChange } = show({ materials });

    fireEvent.change(screen.getByDisplayValue("Video"), { target: { value: "Snimak" } });

    expect(onMaterialChange).toHaveBeenCalledWith(1, "description", "Snimak");
  });

  it("reports which row is to be removed", () => {
    const { onRemoveMaterial } = show({ materials });

    const iconButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent === "");

    fireEvent.click(iconButtons[1]);

    expect(onRemoveMaterial).toHaveBeenCalledWith(1);
  });
});
