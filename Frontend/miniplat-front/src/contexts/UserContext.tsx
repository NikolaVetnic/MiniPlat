import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SessionUser } from "../types/app";
import {
  clearSession,
  readStoredSession,
  storeSession,
  type StoredSession,
} from "../services/session";

export interface UserContextValue {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (token: string, user: SessionUser) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<StoredSession>({
    user: null,
    token: null,
  });

  // Rehydrate a previous sign-in on mount.
  useEffect(() => {
    setSession(readStoredSession());
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: !!session.token,

      signIn: (token, user) => {
        storeSession(token, user);
        setSession({ token, user });
      },

      signOut: () => {
        clearSession();
        setSession({ user: null, token: null });
      },
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
