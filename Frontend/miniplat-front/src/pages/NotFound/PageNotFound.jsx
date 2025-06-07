import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import sr from "../../locales/sr.json";
import styles from "./PageNotFound.module.css";
import { useUser } from "../../contexts/UserContext";

const PageNotFound = ({ onLogout }) => {
  const { user } = useUser();

  const cpt = sr.pages.notFound;

  return (
    <div className={styles.container}>
      <Navbar user={user} onLogout={onLogout} />

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
