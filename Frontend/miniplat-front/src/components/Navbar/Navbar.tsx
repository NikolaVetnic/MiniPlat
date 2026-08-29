import { FiBook, FiLogOut, FiLogIn } from "react-icons/fi";
import { Link } from "react-router-dom";

import styles from "./Navbar.module.css";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { useI18n } from "../../i18n/I18nContext";
import { useUser } from "../../contexts/UserContext";
import useWindowWidth from "../../hooks/useWindowWidth";

interface NavbarProps {
  onLogout: () => void;
}

const Navbar = ({ onLogout }: NavbarProps) => {
  const { user } = useUser();
  const width = useWindowWidth();
  const { t } = useI18n();

  const cpt = t.components.navbar;
  const isMobile = width < 768;

  return (
    <header className={styles.navbar}>
      <Link
        to={user ? `/${user.username}/home` : "/home"}
        className={styles.logoText}
      >
        {isMobile ? <div /> : <FiBook className={styles.logoIcon} />}
        <span className={isMobile ? styles.titleShort : ""}>
          {isMobile ? t.captions.titleShort : t.captions.title}
        </span>
      </Link>

      <div className={styles.rightSection}>
        <LanguageSwitcher />

        {user && (
          <>
            <p className={styles.loggedInText}>
              {cpt.loggedInAs} <strong>{user.username}</strong>
            </p>
            <button className={styles.logoutButton} onClick={onLogout}>
              <span className={styles.logoutIcon}>
                <FiLogOut />
              </span>
              <span>{cpt.buttons.logout}</span>
            </button>
          </>
        )}

        {!user && (
          <Link to="/login" className={styles.loginButton}>
            <span className={styles.loginIcon}>
              <FiLogIn />
            </span>
            <span>{cpt.buttons.login}</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
