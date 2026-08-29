import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deferred } from "../../test/http";
import { signIn, signOut } from "../../test/render";
import { UserProvider } from "../../contexts/UserContext";
import { getSession } from "../../services/session";
import { login, type LoginResult } from "../../services/authService";
import sr from "../../locales/sr.json";
import LoginPage from "./LoginPage";

vi.mock("../../services/authService", () => ({
  login: vi.fn(),
}));

const signInOnServer = vi.mocked(login);

const cpt = sr.pages.login;

const show = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<LoginPage onLogout={vi.fn()} />} />
          <Route path="/:username/home" element={<div>signed-in home</div>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );

const fillIn = (username: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText(cpt.placeholders.username), {
    target: { value: username },
  });
  fireEvent.change(screen.getByPlaceholderText(cpt.placeholders.password), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: cpt.buttons.login }));
};

const accepted: LoginResult = {
  token: "abc123",
  user: { username: "pnikolic" },
  expiresIn: 3600,
};

beforeEach(() => {
  signOut();
  signInOnServer.mockReset();
});

afterEach(() => {
  signOut();
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("shows the form", () => {
    show();

    expect(screen.getByPlaceholderText(cpt.placeholders.username)).toBeDefined();
    expect(screen.getByPlaceholderText(cpt.placeholders.password)).toBeDefined();
    expect(screen.getByRole("button", { name: cpt.buttons.login })).toBeDefined();
  });

  it("sends what was typed in to the sign-in call", async () => {
    signInOnServer.mockResolvedValue(accepted);

    show();
    fillIn("pnikolic", "secret");

    await waitFor(() =>
      expect(signInOnServer).toHaveBeenCalledWith("pnikolic", "secret")
    );
  });

  /**
   * The session is stored through the context, which writes it to the session module -
   * where authHeaders reads it from, outside the component tree.
   */
  it("stores the session and goes to the home page when the sign-in succeeds", async () => {
    signInOnServer.mockResolvedValue(accepted);

    show();
    fillIn("pnikolic", "secret");

    expect(await screen.findByText("signed-in home")).toBeDefined();
    expect(getSession()).toEqual({ token: "abc123", user: { username: "pnikolic" } });
  });

  /**
   * The reason the server gave is kept in state, but what is shown is the same sentence
   * either way - whether a username exists is not something a sign-in page should reveal.
   */
  it("shows the same message whatever was wrong", async () => {
    signInOnServer.mockRejectedValue(new Error("Wrong username or password."));

    show();
    fillIn("pnikolic", "wrong");

    expect(await screen.findByText(cpt.error)).toBeDefined();
    expect(screen.queryByText("Wrong username or password.")).toBeNull();
  });

  it("stores no session when the sign-in was refused", async () => {
    signInOnServer.mockRejectedValue(new Error("Login failed"));

    show();
    fillIn("pnikolic", "wrong");

    await screen.findByText(cpt.error);

    expect(getSession()).toEqual({ token: null, user: null });
  });

  it("lets you try again after a refused sign-in", async () => {
    signInOnServer.mockRejectedValueOnce(new Error("Login failed"));
    signInOnServer.mockResolvedValueOnce(accepted);

    show();
    fillIn("pnikolic", "wrong");
    await screen.findByText(cpt.error);

    fillIn("pnikolic", "secret");

    expect(await screen.findByText("signed-in home")).toBeDefined();
  });

  it("swaps the form for a spinner while the sign-in is out", async () => {
    const response = deferred<LoginResult>();
    signInOnServer.mockReturnValue(response.promise);

    show();
    fillIn("pnikolic", "secret");

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: cpt.buttons.login })).toBeNull()
    );

    response.resolve(accepted);

    expect(await screen.findByText("signed-in home")).toBeDefined();
  });

  /**
   * Someone already signed in has no business on the sign-in page - a bookmarked /login
   * should not look as though the session is gone.
   */
  it("sends someone already signed in straight on", async () => {
    signIn("pnikolic");

    show();

    expect(await screen.findByText("signed-in home")).toBeDefined();
    expect(signInOnServer).not.toHaveBeenCalled();
  });

  /** The page locks scrolling while it is up, and lets it go again when it is left. */
  it("puts scrolling back when the page is left", () => {
    const { unmount } = show();

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("auto");
  });
});
