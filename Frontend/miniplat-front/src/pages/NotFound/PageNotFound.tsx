import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import styles from "./PageNotFound.module.css";
import { useI18n } from "../../i18n/I18nContext";
import { useUser } from "../../contexts/UserContext";

interface PageNotFoundProps {
  onLogout: () => void;
}

const PageNotFound = ({ onLogout }: PageNotFoundProps) => {
  const { user } = useUser();
  const { t } = useI18n();

  const cpt = t.pages.notFound;

  return (
    <div className={styles.container}>
      <Navbar onLogout={onLogout} />

      <div className={styles.contentWrapper}>
        <main className={styles.main}>
          <h1>{cpt.title}</h1>
          <p>{cpt.description}</p>

          <Link
            to={user ? `/${user.username}/home` : "/home"}
            className={styles.backLink}
          >
            {cpt.buttons.return}
          </Link>
        </main>
      </div>
    </div>
  );
};

export default PageNotFound;
