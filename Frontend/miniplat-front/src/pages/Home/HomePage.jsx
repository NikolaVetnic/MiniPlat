import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";

import { downloadSubjectsYaml } from "../../services/downloadYaml";
import { fetchSubjects } from "../../services/subjectsService";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./HomePage.module.css";
import UserCard from "../../components/Cards/User/UserCard";

import footerText from "../../utils/footerText";
import placeholderTexts from "./homeText";
import { useUser } from "../../contexts/UserContext";
import sr from "../../locales/sr.json";
import SubjectCard from "../../components/Cards/Subject/SubjectCard";

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

  return (
    <div className={styles.container}>
      <Navbar user={user} onLogout={onLogout} />
      <div className={styles.contentWrapper}>
        <Sidebar subjects={subjects} loading={loading} />

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1>{sr.pages.home.home}</h1>
          </div>

          <div className={styles.pageContent}>
            <header className={styles.header}>
              <h2>
                {user
                  ? `${sr.pages.home.greetings.lecturers},`
                  : `${sr.pages.home.greetings.students},`}
              </h2>
              {placeholderTexts.mid.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}

              {user?.username === "mp_admin" && (
                <>
                  <button
                    className={styles.downloadYamlButton}
                    onClick={() => downloadSubjectsYaml(subjects)}
                  >
                    Download subjects YAML
                  </button>
                  <div className={styles.adminSubjects}>
                    {subjects.map((subject) => (
                      <SubjectCard
                        key={subject.id}
                        title={subject.title}
                        code={subject.code}
                        level={subject.level}
                        semester={subject.semester}
                        lecturerUsername={subject.lecturer}
                        assistantUsername={subject.assistant}
                      />
                    ))}
                  </div>
                </>
              )}
            </header>

            {user && user?.username != "mp_admin" && <UserCard />}
          </div>

          <footer className={styles.footer}>{footerText}</footer>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
