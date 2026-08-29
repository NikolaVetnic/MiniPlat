import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { SessionUser } from "../types/app";
import {
  clearSession,
  getSession,
  storeSession,
  subscribe,
} from "../services/session";

export interface UserContextValue {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (
    token: string,
    user: SessionUser,
    expiresInSeconds?: number | null
  ) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  /**
   * Subscribed rather than copied into state on mount. The services drop the session from
   * outside the component tree when the server rejects a token, and this is what makes that
   * reach the UI. It also removes the signed-out first render the mount effect used to cause.
   */
  const session = useSyncExternalStore(subscribe, getSession);

  const value = useMemo<UserContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: !!session.token,
      signIn: storeSession,
      signOut: clearSession,
    }),
    [session]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Throws rather than returning null outside a provider. Every caller destructures the
 * result immediately, so a missing provider used to surface as a confusing "cannot
 * destructure null" deep inside a component instead of naming the actual mistake.
 */
export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);

  if (!context)
    throw new Error("useUser must be used within a UserProvider.");

  return context;
};
