import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { UserProvider } from "../contexts/UserContext";
import { clearSession, storeSession } from "../services/session";

/**
 * Komponentene leser hvem som er logget inn gjennom UserProvider, som abonnerer på
 * session-modulen. Testene setter derfor økten der i stedet for å stikke en verdi inn i
 * konteksten - da er det den samme veien som i nettleseren som prøves.
 *
 * Kun importert fra testfiler, så ingenting av dette havner i bundelen.
 */

export const loggInn = (username = "pnikolic"): void => {
  storeSession("test-token", { username });
};

export const loggUt = (): void => clearSession();

interface RenderOptions {
  /** Adressen treet starter på, for komponenter som leser ruten. */
  route?: string;
}

export const renderMedØkt = (ui: ReactElement, { route = "/" }: RenderOptions = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <UserProvider>{ui}</UserProvider>
    </MemoryRouter>
  );
