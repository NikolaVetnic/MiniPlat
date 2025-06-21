import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";

import Content_Admin from "./Content/Content_Admin";
import Content_Lecturers from "./Content/Content_Lecturers";
import Content_Public from "./Content/Content_Public";
import { fetchSubjects } from "../../services/subjectsService";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./HomePage.module.css";
import UserCard from "../../components/Cards/User/UserCard";
import { useUser } from "../../contexts/UserContext";

import footerText from "../../utils/footerText";
import sr from "../../locales/sr.json";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

const HomePage = ({ onLogout }) => {
  const { user } = useUser();
  const { username } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSubjects = async () => {
      setLoading(true);
      try {
        const subjectsData = await fetchSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    getSubjects();
  }, []);

  // if route has username param but no user is logged in → redirect to /home
  if (username && !user) {
    return <Navigate to="/home" />;
  }

  // if route has username param but logged-in user is different → redirect to own home
  if (username && user && username !== user.username) {
    return <Navigate to={`/${user.username}/home`} />;
  }

  const isUserAdmin = user?.username === ADMIN_USERNAME;

  return (
    <div className={styles.container}>
      <Navbar user={user} onLogout={onLogout} />
      <div className={styles.contentWrapper}>
        <Sidebar subjects={subjects} loading={loading} />

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1>
              {isUserAdmin
                ? sr.pages.home.adminControlPanel
                : sr.pages.home.home}
            </h1>
          </div>

          <div className={styles.pageContent}>
            <div className={styles.header}>
              {isUserAdmin ? (
                <Content_Admin subjects={subjects} />
              ) : user ? (
                <Content_Lecturers />
              ) : (
                <Content_Public />
              )}
            </div>

            {user && isUserAdmin && <UserCard />}
          </div>

          <footer className={styles.footer}>{footerText}</footer>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
