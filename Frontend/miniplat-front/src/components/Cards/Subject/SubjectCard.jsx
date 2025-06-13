import { useEffect, useState } from "react";

import { fetchLecturer } from "../../../services/lecturersService";
import styles from "./SubjectCard.module.css"; // your custom styling
import sr from "../../../locales/sr.json";

const LecturerCard = ({ code, lecturerUsername, assistantUsername }) => {
  const [lecturer, setLecturer] = useState(null);
  const [assistant, setAssistant] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cpt = sr.components.cards.subject;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (lecturerUsername) {
          const data = await fetchLecturer(lecturerUsername);
          setLecturer(data);
        }

        if (assistantUsername) {
          const data = await fetchLecturer(assistantUsername);
          setAssistant(data);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to fetch lecturer information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lecturerUsername, assistantUsername]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!lecturer) {
    return <p>{cpt.loading}</p>;
  }

  return (
    <>
      {loading ? (
        <div />
      ) : (
        <section className={styles.subjectCard}>
          <ul>
            <li>
              <strong>{cpt.code}:</strong> {code}
            </li>
            <li>
              <strong>{cpt.lecturer}:</strong>{" "}
              {`${lecturer.title} ${lecturer.user.firstName} ${lecturer.user.lastName}`}
              ,{" "}
              <a href={`mailto:${lecturer.user.email}`}>
                {lecturer.user.email}
              </a>
            </li>
            <li>
              <strong>{cpt.assistant}:</strong>{" "}
              {`${assistant.title} ${assistant.user.firstName} ${assistant.user.lastName}`}
              ,{" "}
              <a href={`mailto:${assistant.user.email}`}>
                {assistant.user.email}
              </a>
            </li>
          </ul>
        </section>
      )}
    </>
  );
};

export default LecturerCard;
