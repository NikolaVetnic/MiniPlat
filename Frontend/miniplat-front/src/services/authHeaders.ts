import { getToken } from "./session";

/**
 * Bearer header when someone is signed in, nothing otherwise.
 *
 * The subject and lecturer reads are open to anonymous visitors, but the server uses the
 * token to decide what to include: a lecturer viewing their own subject gets its hidden and
 * deleted topics, a student gets neither. An expired token simply falls back to the public view.
 */
export const authHeaders = (): Record<string, string> => {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};
