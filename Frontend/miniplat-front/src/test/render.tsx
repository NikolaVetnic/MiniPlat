import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { UserProvider } from "../contexts/UserContext";
import { I18nProvider } from "../i18n/I18nContext";
import { clearSession, storeSession } from "../services/session";

/**
 * The components read who is signed in through UserProvider, which subscribes to the
 * session module. Tests therefore set the session there rather than pushing a value into
 * the context, so what is exercised is the same path the browser takes.
 *
 * Only imported from test files, so none of this reaches the bundle.
 */

export const signIn = (username = "pnikolic"): void => {
  storeSession("test-token", { username });
};

export const signOut = (): void => clearSession();

interface RenderOptions {
  /** The address the tree starts on, for components that read the route. */
  route?: string;
}

export const renderWithSession = (
  ui: ReactElement,
  { route = "/" }: RenderOptions = {}
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <UserProvider>{ui}</UserProvider>
      </I18nProvider>
    </MemoryRouter>
  );
