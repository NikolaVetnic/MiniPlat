import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../../test/http";
import { loggInn, loggUt } from "../../test/render";
import { UserProvider } from "../../contexts/UserContext";
import { getSession } from "../../services/session";
import { login, type LoginResult } from "../../services/authService";
import sr from "../../locales/sr.json";
import LoginPage from "./LoginPage";

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
}));

const loggInnMotServer = vi.mocked(login);

const cpt = sr.pages.login;

const vis = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<LoginPage onLogout={vi.fn()} />} />
          <Route path="/:username/home" element={<div>innlogget forside</div>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );

const fyllUt = (username: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText(cpt.placeholders.username), {
    target: { value: username },
  });
  fireEvent.change(screen.getByPlaceholderText(cpt.placeholders.password), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: cpt.buttons.login }));
};

const godkjent: LoginResult = {
  token: "abc123",
  user: { username: "pnikolic" },
  expiresIn: 3600,
};

beforeEach(() => {
  loggUt();
  loggInnMotServer.mockReset();
});

afterEach(() => {
  loggUt();
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("viser skjemaet", () => {
    vis();

    expect(screen.getByPlaceholderText(cpt.placeholders.username)).toBeDefined();
    expect(screen.getByPlaceholderText(cpt.placeholders.password)).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.login })).toBeDefined();
  });

  it("sender det som ble skrevet inn til innloggingen", async () => {
    loggInnMotServer.mockResolvedValue(godkjent);

    vis();
    fyllUt("pnikolic", "hemmelig");

    await waitFor(() =>
      expect(loggInnMotServer).toHaveBeenCalledWith("pnikolic", "hemmelig")
    );
  });

  /**
   * Økten lagres gjennom konteksten, som skriver den til session-modulen - der
   * authHeaders leser den fra utenfor komponenttreet.
   */
  it("lagrer økten og går til forsiden når innloggingen går gjennom", async () => {
    loggInnMotServer.mockResolvedValue(godkjent);

    vis();
    fyllUt("pnikolic", "hemmelig");

    expect(await screen.findByText("innlogget forside")).toBeDefined();
    expect(getSession()).toEqual({ token: "abc123", user: { username: "pnikolic" } });
  });

  /**
   * Grunnen serveren oppga blir stående i tilstanden, men det som vises er den samme
   * setningen uansett - om brukernavnet finnes eller ikke er ikke noe en innloggingsside
   * skal røpe.
   */
  it("viser den samme beskjeden uansett hva som var galt", async () => {
    loggInnMotServer.mockRejectedValue(new Error("Feil brukernavn eller passord."));

    vis();
    fyllUt("pnikolic", "feil");

    expect(await screen.findByText(cpt.error)).toBeDefined();
    expect(screen.queryByText("Feil brukernavn eller passord.")).toBeNull();
  });

  it("lagrer ingen økt når innloggingen ble avvist", async () => {
    loggInnMotServer.mockRejectedValue(new Error("Login failed"));

    vis();
    fyllUt("pnikolic", "feil");

    await screen.findByText(cpt.error);

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("lar deg prøve igjen etter en avvist innlogging", async () => {
    loggInnMotServer.mockRejectedValueOnce(new Error("Login failed"));
    loggInnMotServer.mockResolvedValueOnce(godkjent);

    vis();
    fyllUt("pnikolic", "feil");
    await screen.findByText(cpt.error);

    fyllUt("pnikolic", "hemmelig");

    expect(await screen.findByText("innlogget forside")).toBeDefined();
  });

  it("bytter ut skjemaet med en spinner mens innloggingen står ute", async () => {
    const svar = deferred<LoginResult>();
    loggInnMotServer.mockReturnValue(svar.promise);

    vis();
    fyllUt("pnikolic", "hemmelig");

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: cpt.buttons.login })).toBeNull()
    );

    svar.resolve(godkjent);

    expect(await screen.findByText("innlogget forside")).toBeDefined();
  });

  /**
   * Den som allerede er logget inn har ingenting på innloggingssiden å gjøre - en
   * bokmerket /login skal ikke se ut som at økten er borte.
   */
  it("sender en som allerede er logget inn videre med én gang", async () => {
    loggInn("pnikolic");

    vis();

    expect(await screen.findByText("innlogget forside")).toBeDefined();
    expect(loggInnMotServer).not.toHaveBeenCalled();
  });

  /** Siden låser rullingen mens den er oppe, og slipper den igjen når den forlates. */
  it("legger tilbake rullingen på siden når den forlates", () => {
    const { unmount } = vis();

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("auto");
  });
});
