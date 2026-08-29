import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import Navbar from "../Navbar/Navbar";
import no from "../../locales/no.json";
import sr from "../../locales/sr.json";
import { I18nProvider } from "../../i18n/I18nContext";
import { UserProvider } from "../../contexts/UserContext";

/**
 * Exercised through the Navbar rather than on its own: what matters is not that the select
 * changes value but that the captions around it follow, and that the choice survives a
 * remount the way a reload would leave it.
 */
const show = () =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <UserProvider>
          <Navbar onLogout={() => {}} />
        </UserProvider>
      </I18nProvider>
    </MemoryRouter>
  );

const picker = () => screen.getByRole("combobox", { name: sr.components.language.label });

describe("LanguageSwitcher", () => {
  beforeEach(() => localStorage.clear());

  it("starts on Serbian", () => {
    show();

    expect(screen.getByText(sr.components.navbar.buttons.login)).toBeDefined();
    expect((picker() as HTMLSelectElement).value).toBe("sr");
  });

  it("offers every language under its own name", () => {
    show();

    expect(screen.getByRole("option", { name: sr.languageName })).toBeDefined();
    expect(screen.getByRole("option", { name: no.languageName })).toBeDefined();
  });

  it("switches the captions when another language is picked", () => {
    show();

    fireEvent.change(picker(), { target: { value: "no" } });

    expect(screen.getByText(no.components.navbar.buttons.login)).toBeDefined();
    expect(screen.queryByText(sr.components.navbar.buttons.login)).toBeNull();
  });

  it("remembers the choice across a remount", () => {
    const { unmount } = show();

    fireEvent.change(picker(), { target: { value: "no" } });
    unmount();
    show();

    expect(screen.getByText(no.components.navbar.buttons.login)).toBeDefined();
  });

  it("ignores a stored language it does not know", () => {
    localStorage.setItem("language", "en");
    show();

    expect(screen.getByText(sr.components.navbar.buttons.login)).toBeDefined();
  });

  it("puts the active locale on the document", () => {
    show();
    expect(document.documentElement.lang).toBe(sr.locale);

    fireEvent.change(picker(), { target: { value: "no" } });
    expect(document.documentElement.lang).toBe(no.locale);
  });
});
