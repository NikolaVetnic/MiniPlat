import { useEffect, useState } from "react";

import { fetchLecturer } from "../../../services/lecturersService";
import styles from "./SubjectCard.module.css";
import sr from "../../../locales/sr.json";
import { useUser } from "../../../contexts/UserContext";

const SubjectCard = ({
  title,
  code,
  level,
  semester,
  lecturerUsername,
  assistantUsername,
}) => {
  const { user } = useUser();

  const [lecturer, setLecturer] = useState(null);
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cpt = sr.components.cards.subject;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lecturerPromise = lecturerUsername
          ? fetchLecturer(lecturerUsername)
          : Promise.resolve(null);

        const assistantPromise = assistantUsername
          ? fetchLecturer(assistantUsername)
          : Promise.resolve(null);

        const [lecturerData, assistantData] = await Promise.all([
          lecturerPromise,
          assistantPromise,
        ]);

        setLecturer(lecturerData);
        setAssistant(assistantData);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch lecturer information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lecturerUsername, assistantUsername]);

  if (error) return <p>{error}</p>;
  if (loading || !lecturer) return <p>{cpt.loading}</p>;

  const year = Math.floor((semester - 1) / 2) + 1;
  const semesterName =
    semester / 2 === 1 ? cpt.semester.summer : cpt.semester.winter;

  const renderPerson = (person, label) =>
    person && (
      <li>
        {/* <strong>{label}:</strong>{" "} */}
        {`${person.title} ${person.user.firstName} ${person.user.lastName}`}
        {person.user.email && (
          <>
            {", "}
            <a href={`mailto:${person.user.email}`}>{person.user.email}</a>
          </>
        )}
      </li>
    );

  return (
    <section className={styles.subjectCard}>
      <ul>
        {user?.username === "mp_admin" && (
          <li>
            <strong>{cpt.title}:</strong> {title}
          </li>
        )}
        <li>
          <strong>{cpt.code}:</strong> {code}
        </li>
        <li>
          <strong>{cpt.level.caption}:</strong>{" "}
          {level === 1 ? cpt.level.undergraduate : cpt.level.master}
        </li>
        <li>
          <strong>{cpt.year.caption}:</strong>{" "}
          {`${year} (${semesterName} semestar)`}
        </li>
        {renderPerson(lecturer, cpt.lecturer)}
        {renderPerson(assistant, cpt.assistant)}
      </ul>
    </section>
  );
};

export default SubjectCard;
