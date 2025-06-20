import { downloadSubjectsYaml } from "../../../services/downloadYaml"; // adjust if needed
import sr from "../../../locales/sr.json";
import styles from "../HomePage.module.css";
import SubjectCard from "../../../components/Cards/Subject/SubjectCard";

const Content_Admin = ({ subjects }) => {
  const cpt = sr.pages.home;

  return (
    <>
      <button
        className={styles.downloadYamlButton}
        onClick={() => downloadSubjectsYaml(subjects)}
      >
        {cpt.buttons.dumpDatabaseAsYaml}
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
            isActive={subject.isActive}
          />
        ))}
      </div>
    </>
  );
};

export default Content_Admin;
