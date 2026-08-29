import type { Dictionary } from "../i18n/types";

/**
 * A function rather than a constant: the captions it reads change when the reader switches
 * language, which a value computed once at import time could never follow.
 */
export const footerText = (captions: Dictionary["captions"]): string => {
  const year = new Date().getFullYear();

  return `© ${year} - ${captions.title}. ${captions.companyName}`;
};

export default footerText;
