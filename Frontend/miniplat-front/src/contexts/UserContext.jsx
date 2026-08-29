import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clearSession,
  readStoredSession,
  storeSession,
} from "../services/session";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState({ user: null, token: null });

  // Rehydrate a previous sign-in on mount.
  useEffect(() => {
    setSession(readStoredSession());
  }, []);

  const value = useMemo(
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

export const useUser = () => useContext(UserContext);
