import { downloadSubjectsYaml } from "../../../services/downloadYaml";
import sr from "../../../locales/sr.json";
import styles from "../HomePage.module.css";
import type { Subject } from "../../../types/api";
import SubjectCard from "../../../components/Cards/Subject/SubjectCard";

interface ContentAdminProps {
  subjects: Subject[];
}

const Content_Admin = ({ subjects }: ContentAdminProps) => {
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
            id={subject.id}
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
