import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_LANGUAGE, dictionaries, isLanguage } from "./dictionaries";
import type { Dictionary, Language } from "./types";

const STORAGE_KEY = "language";

export interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** The captions for the active language, in the shape the locale files have. */
  t: Dictionary;
}

/**
 * Defaulted rather than null, unlike UserContext: a component rendered outside the
 * provider still has captions to show, and every unit test that renders a single
 * component bare keeps working. Switching languages is what needs the provider.
 */
const I18nContext = createContext<I18nValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: dictionaries[DEFAULT_LANGUAGE],
});

const readStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    // A browser that refuses storage is not a reason to fail the first render.
    return DEFAULT_LANGUAGE;
  }
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies to this session; only remembering it fails.
    }
  }, []);

  // Screen readers and the browser's own hyphenation read this, not the picker.
  useEffect(() => {
    document.documentElement.lang = dictionaries[language].locale;
  }, [language]);

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t: dictionaries[language] }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => useContext(I18nContext);
