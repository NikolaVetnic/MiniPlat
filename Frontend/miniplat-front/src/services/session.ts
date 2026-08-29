import type { SessionUser } from "../types/app";

/**
 * The only module that touches the stored session. Everything else - components through
 * UserContext, plain modules through getToken - goes via here, so the storage keys and the
 * in-memory copy can never drift apart.
 *
 * It doubles as an external store: the services drop the session from outside the component
 * tree when the server rejects a token, and subscribers are told so the UI stops claiming to
 * be signed in.
 */
const TOKEN_KEY = "token";
const USER_KEY = "user";
const EXPIRES_KEY = "tokenExpiresAt";

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

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A session that lives only for this page is still better than a failed sign-in.
  }
};

const remove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // nothing to clean up
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

const parseExpiry = (raw: string | null): number | null => {
  const value = Number(raw);

  return raw && Number.isFinite(value) ? value : null;
};

/**
 * Held as one object so useSyncExternalStore can compare identities: it is replaced only
 * when the session actually changes, never rebuilt on every read.
 */
let snapshot: StoredSession = { token: null, user: null };
let expiresAt: number | null = null;

const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getSession = (): StoredSession => snapshot;

const loadFromStorage = (): void => {
  snapshot = { token: read(TOKEN_KEY), user: parseUser(read(USER_KEY)) };
  expiresAt = parseExpiry(read(EXPIRES_KEY));
};

loadFromStorage();

const hasExpired = (): boolean => expiresAt !== null && Date.now() >= expiresAt;

/**
 * Checks expiry rather than waiting for the server to say no, so a request that is certain
 * to be rejected is never sent and the UI drops back to signed-out on its own.
 */
export const getToken = (): string | null => {
  if (snapshot.token && hasExpired()) clearSession();

  return snapshot.token;
};

/** Re-reads storage, in case it was written after this module was first evaluated. */
export const readStoredSession = (): StoredSession => {
  loadFromStorage();

  return snapshot;
};

export const storeSession = (
  newToken: string,
  user: SessionUser,
  expiresInSeconds?: number | null
): void => {
  expiresAt =
    typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)
      ? Date.now() + expiresInSeconds * 1000
      : null;

  snapshot = { token: newToken, user };

  write(TOKEN_KEY, newToken);
  write(USER_KEY, JSON.stringify(user));

  if (expiresAt === null) remove(EXPIRES_KEY);
  else write(EXPIRES_KEY, String(expiresAt));

  emit();
};

export const clearSession = (): void => {
  // Guarded so a 401 on an endpoint the visitor was never signed in for does not push a
  // pointless re-render through every subscriber.
  if (snapshot.token === null && snapshot.user === null) return;

  expiresAt = null;
  snapshot = { token: null, user: null };

  remove(TOKEN_KEY);
  remove(USER_KEY);
  remove(EXPIRES_KEY);

  emit();
};
