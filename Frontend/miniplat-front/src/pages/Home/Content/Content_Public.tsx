import Guide from "../../../i18n/Guide";
import { useI18n } from "../../../i18n/I18nContext";

/** The guide shown to anonymous visitors; its prose lives in the locale files. */
const Content_Public = () => {
  const { t } = useI18n();

  return <Guide blocks={t.pages.home.guides.students.blocks} />;
};

export default Content_Public;
