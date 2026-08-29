/**
 * The only module that touches the stored session. Everything else - components through
 * UserContext, plain modules through getToken - goes via here, so the storage keys and the
 * in-memory copy can never drift apart.
 */
const TOKEN_KEY = "token";
const USER_KEY = "user";

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode, or storage blocked
  }
};

// Mirrored in memory so non-React callers can read the token synchronously.
let token = read(TOKEN_KEY);

export const getToken = () => token;

export const readStoredSession = () => {
  const storedUser = read(USER_KEY);

  return {
    token,
    user: storedUser ? JSON.parse(storedUser) : null,
  };
};

export const storeSession = (newToken, user) => {
  token = newToken;

  try {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // A session that lives only for this page is still better than a failed sign-in.
  }
};

export const clearSession = () => {
  token = null;

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // nothing to clean up
  }
};
