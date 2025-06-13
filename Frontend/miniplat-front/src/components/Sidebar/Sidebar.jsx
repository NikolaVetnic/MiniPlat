import { PiNotePencil } from "react-icons/pi";

import NavItem from "./NavItem/NavItem";
import sr from "../../locales/sr.json";
import styles from "./Sidebar.module.css";
import { useUser } from "../../contexts/UserContext";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

const Sidebar = ({ subjects = [], loading = false }) => {
  const { user } = useUser();
  const cpt = sr.components.sidebar;

  if (loading) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.spinner}></div>
      </aside>
    );
  }

  const subjectsToDisplay = user
    ? subjects.filter(
        (subject) =>
          user.username == subject.lecturer ||
          user.username == subject.assistant ||
          user.username == ADMIN_USERNAME
      )
    : subjects;

  return (
    <aside className={styles.sidebar}>
      <h2>{cpt.mainMenu}</h2>
      <nav className={styles.nav}>
        <ul>
          {user ? (
            <NavItem
              icon={PiNotePencil}
              text={cpt.home}
              href={`/${user.username}/home`}
            />
          ) : (
            <NavItem icon={PiNotePencil} text={cpt.home} href="/home" />
          )}
        </ul>
      </nav>
      <h2>{cpt.subjects}</h2>
      <nav className={styles.nav}>
        <ul>
          {subjectsToDisplay.map((subject) => (
            <NavItem
              icon={PiNotePencil}
              key={subject.id}
              text={subject.title}
              href={
                user
                  ? `/${user.username}/subjects/${encodeURIComponent(
                      subject.id
                    )}`
                  : `/subjects/${encodeURIComponent(subject.id)}`
              }
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
