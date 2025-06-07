import { PiNotePencil } from "react-icons/pi";

import NavItem from "./NavItem/NavItem";
import sr from "../../locales/sr.json";
import styles from "./Sidebar.module.css";
import { useUser } from "../../contexts/UserContext";

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

  const userSubjects = user
    ? subjects.filter((subject) => subject.owners.includes(user.username))
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
          {userSubjects.map((subject) => (
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
