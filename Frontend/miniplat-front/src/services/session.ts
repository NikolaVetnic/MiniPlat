import type { SessionUser } from "../types/app";

/**
 * The only module that touches the stored session. Everything else - components through
 * UserContext, plain modules through getToken - goes via here, so the storage keys and the
 * in-memory copy can never drift apart.
 */
const TOKEN_KEY = "token";
const USER_KEY = "user";

export interface StoredSession {
  token: string | null;
  user: SessionUser | null;
}

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode, or storage blocked
  }
};

/**
 * Storage is attacker-adjacent in the sense that anything can end up there: a half-written
 * value, a leftover from an older shape, a hand-edited entry. A stored user that does not
 * carry a username is unusable to every consumer, so it is treated as no user at all rather
 * than handed on to crash a render.
 */
const parseUser = (raw: string | null): SessionUser | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as { username?: unknown }).username === "string"
    ) {
      return parsed as SessionUser;
    }

    return null;
  } catch {
    return null; // not json at all
  }
};

// Mirrored in memory so non-React callers can read the token synchronously.
let token: string | null = read(TOKEN_KEY);

export const getToken = (): string | null => token;

/**
 * Re-syncs the mirror from storage rather than trusting the copy taken at import. The user
 * was always read fresh here, so a token cached at module load could disagree with it -
 * after a write from another tab, or any import that happened before the session was stored.
 */
export const readStoredSession = (): StoredSession => {
  token = read(TOKEN_KEY);

  return {
    token,
    user: parseUser(read(USER_KEY)),
  };
};

export const storeSession = (newToken: string, user: SessionUser): void => {
  token = newToken;

  try {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // A session that lives only for this page is still better than a failed sign-in.
  }
};

export const clearSession = (): void => {
  token = null;

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // nothing to clean up
  }
};
