import { FiBook, FiLogOut, FiLogIn } from "react-icons/fi";
import { Link } from "react-router-dom";

import sr from "../../locales/sr.json";
import styles from "./Navbar.module.css";
import { useUser } from "../../contexts/UserContext"; // adjust path as needed

const Navbar = ({ onLogout }) => {
  const { user } = useUser(); // get user from context

  const cpt = sr.components.navbar;

  return (
    <header className={styles.navbar}>
      <Link
        to={user ? `/${user.username}/home` : "/home"}
        className={styles.logoText}
      >
        <FiBook className={styles.logoIcon} />
        <span>{sr.captions.title}</span>
      </Link>

      <div className={styles.rightSection}>
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
