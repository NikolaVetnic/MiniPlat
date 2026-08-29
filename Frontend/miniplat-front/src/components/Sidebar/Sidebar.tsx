import { useState, useEffect } from "react";
import { PiNotePencil, PiListBold } from "react-icons/pi";

import NavItem from "./NavItem/NavItem";
import sr from "../../locales/sr.json";
import styles from "./Sidebar.module.css";
import type { Subject } from "../../types/api";
import { useUser } from "../../contexts/UserContext";
import { groupLabel, groupSubjects, visibleSubjects } from "./grouping";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const LOCAL_STORAGE_KEY = "sidebarExpandedGroups";

interface SidebarProps {
  subjects?: Subject[];
  loading?: boolean;
}

/** Which group keys are open. Persisted so the tree survives a reload. */
type ExpandedGroups = Record<string, boolean>;

const readExpandedGroups = (): ExpandedGroups => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);

    return typeof parsed === "object" && parsed !== null
      ? (parsed as ExpandedGroups)
      : {};
  } catch {
    console.warn("Invalid localStorage format for sidebar groups");
    return {};
  }
};

const Sidebar = ({ subjects = [], loading = false }: SidebarProps) => {
  const { user } = useUser();
  const cpt = sr.components.sidebar;

  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>({});
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [showSubjects, setShowSubjects] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const toggleSidebar = () => setIsVisible((prev) => !prev);

  useEffect(() => {
    setExpandedGroups(readExpandedGroups());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expandedGroups));
    } catch {
      // A sidebar that forgets its open groups is not worth failing a render over.
    }
  }, [expandedGroups]);

  const orderedGroups = groupSubjects(
    visibleSubjects(subjects, user, ADMIN_USERNAME)
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const collapsibleHeader = (text: string, isOpen: boolean) => (
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

  return (
    <>
      {/* Toggle Button */}
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        <PiListBold size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          isVisible ? styles.visible : styles.hidden
        }`}
      >
        {loading ? (
          <div className={styles.spinner}></div>
        ) : (
          <>
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
                {orderedGroups.map(([groupKey, subjectsInGroup]) => {
                  const isOpen = !!expandedGroups[groupKey];
                  const label = groupLabel(groupKey, cpt);

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
                            transform: isOpen
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          ▶
                        </span>
                        {label}
                      </h2>

                      {isOpen && (
                        <ul>
                          {subjectsInGroup.map((subject, index) => (
                            <NavItem
                              key={subject.id}
                              icon={PiNotePencil}
                              index={index}
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
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
