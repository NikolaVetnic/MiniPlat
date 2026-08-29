import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";

import styles from "./SubjectCard.module.css";
import sr from "../../../locales/sr.json";
import {
  Level,
  type LecturerDetails,
  type LecturerSummary,
  type Uuid,
} from "../../../types/api";
import { updateSubjectPeople } from "../../../services/subjectsService";
import { useSubjectPeople } from "../../../hooks/useSubjectPeople";
import { useUser } from "../../../contexts/UserContext";
import { useLecturers } from "../../../hooks/useLecturers";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

interface SubjectCardProps {
  id: Uuid;
  title: string;
  code: string;
  level: Level;
  semester: number;
  lecturerUsername: string;
  assistantUsername: string | null;
  isActive: boolean;
  isSingleCard?: boolean;
}

const SubjectCard = ({
  id,
  title,
  code,
  level,
  semester,
  lecturerUsername,
  assistantUsername,
  isActive,
  isSingleCard = false,
}: SubjectCardProps) => {
  const { user } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedLecturer, setSelectedLecturer] = useState(lecturerUsername);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(
    assistantUsername
  );

  const { lecturer, assistant, loading, error, refetch } = useSubjectPeople(
    lecturerUsername,
    assistantUsername
  );

  // Only requested once the editor is open, so a plain visitor never pulls the roster.
  const { lecturers, error: lecturersError } = useLecturers(isEditing);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
    setSelectedLecturer(lecturerUsername);
    setSelectedAssistant(assistantUsername);
  };

  const handleConfirmEdit = async () => {
    try {
      setSaveError(null);
      await updateSubjectPeople(id, selectedLecturer, selectedAssistant);
      await refetch(selectedLecturer, selectedAssistant);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setSaveError("Failed to save changes.");
    }
  };

  const cpt = sr.components.cards.subject;

  if (error) return <p>{error}</p>;
  if (loading || !lecturer) return <p>{cpt.loading}</p>;

  const year = Math.floor((semester - 1) / 2) + 1;
  const semesterName =
    semester % 2 === 0 ? cpt.semester.summer : cpt.semester.winter;

  const renderPerson = (person: LecturerDetails | null, label: string) =>
    person && (
      <li>
        <strong>{label}:</strong>{" "}
        {[person.title, person.firstName, person.lastName]
          .filter(Boolean)
          .join(" ")}
        {person.email && (
          <>
            {", "}
            <a href={`mailto:${person.email}`}>{person.email}</a>
          </>
        )}
      </li>
    );

  const isUserAdmin = user?.username === ADMIN_USERNAME;

  const lecturerLabel = (l: LecturerSummary) =>
    [l.title, l.firstName, l.lastName].filter(Boolean).join(" ") || l.username;

  // Keeps the saved username selectable while the roster loads, or if that person
  // is no longer on it. The placeholder carries nulls rather than missing fields, so
  // lecturerLabel falls back to the username without special-casing it.
  const optionsFor = (
    selected: string | null,
    excluded: string | null
  ): LecturerSummary[] => {
    const available = lecturers.filter((l) => l.username !== excluded);

    return selected && !available.some((l) => l.username === selected)
      ? [
          { username: selected, title: null, firstName: null, lastName: null },
          ...available,
        ]
      : available;
  };

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
                      onClick={() => void handleConfirmEdit()}
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
            {level === Level.Undergraduate
              ? cpt.level.undergraduate
              : cpt.level.master}
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
                  {optionsFor(selectedLecturer, selectedAssistant).map((l) => (
                    <option key={l.username} value={l.username}>
                      {lecturerLabel(l)}
                    </option>
                  ))}
                </select>
              </li>

              <li className={styles.selectRow}>
                <strong>{cpt.assistant}:</strong>
                <select
                  id="assistant"
                  value={selectedAssistant ?? ""}
                  onChange={(e) => setSelectedAssistant(e.target.value || null)}
                >
                  <option value="">–</option>
                  {optionsFor(selectedAssistant, selectedLecturer).map((l) => (
                    <option key={l.username} value={l.username}>
                      {lecturerLabel(l)}
                    </option>
                  ))}
                </select>
              </li>

              {(lecturersError || saveError) && (
                <li>
                  <em>{lecturersError || saveError}</em>
                </li>
              )}
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
