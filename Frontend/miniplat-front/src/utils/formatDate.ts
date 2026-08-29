import type { IsoDateTime } from "../types/api";

/**
 * Nullbare tidsstempler er med vilje ikke tillatt her: new Date(null) gir epoken og
 * ville rendret "1. januar 1970" som om det var en ekte dato. Hvilken tekst som skal
 * stå når feltet mangler er en beslutning som hører hjemme hos den som rendrer.
 */
export const formatDate = (
  isoString: IsoDateTime,
  locale = "sr-Latn-RS"
): string => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
