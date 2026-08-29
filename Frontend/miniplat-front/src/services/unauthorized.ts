import { clearSession, getToken } from "./session";

/**
 * Drops the stored session when the server refuses the token it was sent.
 *
 * Without this the app keeps looking signed in - the navbar shows the username, the edit
 * controls stay - while every write is refused, because the read endpoints answer an expired
 * token with the anonymous view rather than an error.
 *
 * Deliberately 401 only. The API answers 403 for "you may only edit subjects you teach",
 * which is a perfectly valid session meeting an ownership rule, and signing that user out
 * would be wrong.
 */
export const dropSessionIfRejected = (response: Response): void => {
  if (response.status === 401 && getToken()) clearSession();
};
