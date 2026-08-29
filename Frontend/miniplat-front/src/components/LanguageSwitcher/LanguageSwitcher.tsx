import { FiGlobe } from "react-icons/fi";

import styles from "./LanguageSwitcher.module.css";
import { dictionaries, LANGUAGES } from "../../i18n/dictionaries";
import { useI18n } from "../../i18n/I18nContext";
import type { Language } from "../../i18n/types";

/**
 * Each option is labelled in its own language, so someone who has landed on a language
 * they do not read can still find their way back out.
 */
const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className={styles.switcher}>
      <label htmlFor="language" className={styles.label}>
        <FiGlobe aria-label={t.components.language.label} />
      </label>
      <select
        id="language"
        className={styles.select}
        value={language}
        aria-label={t.components.language.label}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {dictionaries[lang].languageName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
