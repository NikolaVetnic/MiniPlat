/**
 * Returns the url only if it is safe to put in an href, otherwise null.
 *
 * The server rejects anything but http and https on save, but this also covers links stored
 * before that check existed: React happily renders href="javascript:..." and the browser runs
 * it in the reader's session.
 */
export const safeLink = (url) => {
  if (!url) return null;

  try {
    const { protocol } = new URL(url, window.location.origin);

    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null; // not a url at all
  }
};
