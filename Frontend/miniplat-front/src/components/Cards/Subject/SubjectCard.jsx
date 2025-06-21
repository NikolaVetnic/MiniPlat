import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";

import styles from "./SubjectCard.module.css";
import sr from "../../../locales/sr.json";
import { updateSubjectPeople } from "../../../services/subjectsService";
import { useSubjectPeople } from "../../../hooks/useSubjectPeople";
import { useUser } from "../../../contexts/UserContext";

import lecturerUsernames from "../../../utils/lecturerUsernames";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

const SubjectCard = ({
  id,
  title,
  code,
  level,
  semester,
  lecturerUsername,
  assistantUsername,
  isActive,
  isSingleCard,
}) => {
  const { user } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(lecturerUsername);
  const [selectedAssistant, setSelectedAssistant] = useState(assistantUsername);

  const { lecturer, assistant, loading, error, refetch } = useSubjectPeople(
    lecturerUsername,
    assistantUsername
  );

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedLecturer(lecturerUsername);
    setSelectedAssistant(assistantUsername);
  };

  const handleConfirmEdit = async () => {
    try {
      await updateSubjectPeople(id, selectedLecturer, selectedAssistant);
      await refetch(selectedLecturer, selectedAssistant);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save changes.");
    }
  };

  const cpt = sr.components.cards.subject;

  if (error) return <p>{error}</p>;
  if (loading || !lecturer) return <p>{cpt.loading}</p>;

  const year = Math.floor((semester - 1) / 2) + 1;
  const semesterName =
    semester % 2 === 0 ? cpt.semester.summer : cpt.semester.winter;

  const renderPerson = (person, label) =>
    person && (
      <li>
        <strong>{label}:</strong>{" "}
        {`${person.title} ${person.user.firstName} ${person.user.lastName}`}
        {person.user.email && (
          <>
            {", "}
            <a href={`mailto:${person.user.email}`}>{person.user.email}</a>
          </>
        )}
      </li>
    );

  const isUserAdmin = user?.username === ADMIN_USERNAME;

  return (
    <section
      className={`${styles.subjectCard} ${
        isSingleCard ? styles.subjectCardSingle : ""
      }`}
    >
      <div className={styles.cardContent}>
        <ul>
          {isUserAdmin && (
            <>
              <div className={styles.editControls}>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editBtn}
                  >
                    <FiEdit2 />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className={styles.cancelBtn}
                    >
                      <FiX />
                    </button>
                    <button
                      onClick={handleConfirmEdit}
                      className={styles.okBtn}
                    >
                      <FiCheck />
                    </button>
                  </>
                )}
              </div>
              <li>
                <strong>{cpt.title}:</strong> {title}
              </li>
            </>
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
          <li>
            <strong>{cpt.semester.caption}:</strong> {`${semester}`}
          </li>
          {isEditing ? (
            <>
              <li className={styles.selectRow}>
                <strong>{cpt.lecturer}:</strong>
                <select
                  id="lecturer"
                  value={selectedLecturer}
                  onChange={(e) => setSelectedLecturer(e.target.value)}
                >
                  {lecturerUsernames
                    .filter((l) => l.username !== selectedAssistant) // exclude selected assistant
                    .map((l) => (
                      <option key={l.username} value={l.username}>
                        {l.username}
                      </option>
                    ))}
                </select>
              </li>

              <li className={styles.selectRow}>
                <strong>{cpt.assistant}:</strong>
                <select
                  id="assistant"
                  value={selectedAssistant || ""}
                  onChange={(e) => setSelectedAssistant(e.target.value || null)}
                >
                  <option value="">–</option>
                  {lecturerUsernames
                    .filter((l) => l.username !== selectedLecturer) // exclude selected lecturer
                    .map((l) => (
                      <option key={l.username} value={l.username}>
                        {l.username}
                      </option>
                    ))}
                </select>
              </li>
            </>
          ) : (
            <>
              {renderPerson(lecturer, cpt.lecturer)}
              {renderPerson(assistant, cpt.assistant)}
            </>
          )}
        </ul>
      </div>

      <div
        className={`${styles.statusBar} ${
          isActive ? styles.statusActive : styles.statusDeleted
        }`}
      >
        {isActive ? cpt.active.true : cpt.active.false}
      </div>
    </section>
  );
};

export default SubjectCard;
