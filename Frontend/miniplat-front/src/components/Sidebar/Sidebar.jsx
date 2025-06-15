import { useState, useEffect } from "react";
import { PiNotePencil } from "react-icons/pi";
import NavItem from "./NavItem/NavItem";
import sr from "../../locales/sr.json";
import styles from "./Sidebar.module.css";
import { useUser } from "../../contexts/UserContext";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const LOCAL_STORAGE_KEY = "sidebarExpandedGroups";

const Sidebar = ({ subjects = [], loading = false }) => {
  const { user } = useUser();
  const cpt = sr.components.sidebar;

  const [expandedGroups, setExpandedGroups] = useState({});
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showSubjects, setShowSubjects] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setExpandedGroups(JSON.parse(stored));
      } catch {
        console.warn("Invalid localStorage format for sidebar groups");
      }
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const collapsibleHeader = (text, isOpen) => (
    <h2
      onClick={() =>
        text === cpt.mainMenu
          ? setShowMainMenu((prev) => !prev)
          : setShowSubjects((prev) => !prev)
      }
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.9rem",
        fontWeight: "normal",
        margin: "1rem 0 0.5rem 0",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        ▶
      </span>
      {text}
    </h2>
  );

  if (loading) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.spinner}></div>
      </aside>
    );
  }

  const subjectsToDisplay = subjects.filter((subject) => {
    const isUserRelated =
      !user ||
      user.username === subject.lecturer ||
      user.username === subject.assistant ||
      user.username === ADMIN_USERNAME;

    return isUserRelated && subject.isActive;
  });

  const groupedSubjects = {};
  subjectsToDisplay.forEach((subject) => {
    const key = `${subject.level}-${subject.semester}`;
    if (!groupedSubjects[key]) groupedSubjects[key] = [];
    groupedSubjects[key].push(subject);
  });

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside className={styles.sidebar}>
      {collapsibleHeader(cpt.mainMenu, showMainMenu)}
      {showMainMenu && (
        <nav className={styles.nav}>
          <ul>
            <NavItem
              icon={PiNotePencil}
              text={cpt.home}
              href={user ? `/${user.username}/home` : "/home"}
            />
          </ul>
        </nav>
      )}

      {showSubjects && (
        <nav className={styles.nav}>
          {Object.entries(groupedSubjects)
            .sort((a, b) => {
              const [aLevel, aSemester] = a[0].split("-").map(Number);
              const [bLevel, bSemester] = b[0].split("-").map(Number);
              return aLevel !== bLevel
                ? aLevel - bLevel
                : aSemester - bSemester;
            })
            .map(([groupKey, groupSubjects]) => {
              const [level, semester] = groupKey.split("-");
              const isOpen = !!expandedGroups[groupKey];

              const label = `${cpt.levels[level - 1]}, ${
                cpt.years[Math.floor((semester - 1) / 2)]
              } - ${cpt.semester[semester % 2]}`;

              return (
                <div key={groupKey}>
                  <h2
                    onClick={() => toggleGroup(groupKey)}
                    style={{
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "normal",
                      margin: "1rem 0 0.5rem 0",
                      display: "flex",
                      alignItems: "center",
                      userSelect: "none",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▶
                    </span>
                    {label}
                  </h2>

                  {isOpen && (
                    <ul>
                      {groupSubjects.map((subject) => (
                        <NavItem
                          key={subject.id}
                          icon={PiNotePencil}
                          text={subject.title}
                          href={
                            user
                              ? `/${
                                  user.username
                                }/subjects/${encodeURIComponent(subject.id)}`
                              : `/subjects/${encodeURIComponent(subject.id)}`
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </nav>
      )}
    </aside>
  );
};

export default Sidebar;
