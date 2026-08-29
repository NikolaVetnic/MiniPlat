import Guide from "../../../i18n/Guide";
import { useI18n } from "../../../i18n/I18nContext";

/** The guide shown to signed-in teaching staff; its prose lives in the locale files. */
const Content_Lecturers = () => {
  const { t } = useI18n();

  return <Guide blocks={t.pages.home.guides.lecturers.blocks} />;
};

export default Content_Lecturers;
