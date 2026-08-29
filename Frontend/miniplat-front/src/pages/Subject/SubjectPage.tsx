import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import {
  ConflictError,
  fetchSubjects,
  updateSubjectTopics,
  updateTopicOrder,
  updateTopicState,
} from "../../services/subjectsService";
import type { Subject, Topic, Uuid } from "../../types/api";
import type { MaterialDraft } from "../../types/app";
import { newTopic, toMaterials } from "../../utils/drafts";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import sr from "../../locales/sr.json";
import styles from "../Home/HomePage.module.css";
import SubjectCard from "../../components/Cards/Subject/SubjectCard";
import subjectPageStyles from "./SubjectPage.module.css";
import TopicCard from "../../components/Cards/Topic/TopicCard";
import TopicModal, {
  type MaterialField,
} from "../../components/Modals/Topic/TopicModal";
import { useUser } from "../../contexts/UserContext";
import footerText from "../../utils/footerText";

interface SubjectPageProps {
  onLogout: () => void;
}

/** The two topic booleans the per-topic endpoint can flip. */
type TopicFlag = "isHidden" | "isDeleted";

const SubjectPage = ({ onLogout }: SubjectPageProps) => {
  const { subjectId } = useParams();
  const { user } = useUser();

  // State for subject and subjects list
  const [subject, setSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Modal state and topic inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaterials, setNewMaterials] = useState<MaterialDraft[]>([]);

  // Surfaced when a save fails, so the page stops pretending it succeeded
  const [saveError, setSaveError] = useState<string | null>(null);

  // Persists the change and reports failure instead of swallowing it. Kept out of the
  // setSubject updater: an updater must stay pure, and a rejection thrown inside one is lost.
  const persistTopics = (updatedSubject: Subject, updatedTopics: Topic[]) => {
    setSaveError(null);

    updateSubjectTopics(updatedSubject, updatedTopics).catch((err: unknown) => {
      console.error(err);
      setSaveError(
        err instanceof ConflictError
          ? sr.pages.subject.saveConflict
          : sr.pages.subject.saveFailed
      );
    });
  };

  // Fetch all subjects and select current one
  useEffect(() => {
    const getSubjects = async () => {
      setLoading(true);
      try {
        const data = await fetchSubjects();
        setSubjects(data);
        setSubject(data.find((s) => s.id === subjectId) ?? null);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    void getSubjects();
  }, [subjectId]);

  // Handlers for material inputs in modal
  const handleNewMaterialChange = (
    index: number,
    field: MaterialField,
    value: string
  ) => {
    setNewMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };
  const handleAddNewMaterial = () =>
    setNewMaterials((prev) => [...prev, { description: "", link: "" }]);
  const handleRemoveNewMaterial = (index: number) =>
    setNewMaterials((prev) => prev.filter((_, i) => i !== index));

  // Save edited topic
  const handleTopicEdit = (updatedTopic: Topic) => {
    if (!subject) return;

    const updatedTopics = subject.topics.map((t) =>
      t.id === updatedTopic.id ? updatedTopic : t
    );
    const updatedSubject = { ...subject, topics: updatedTopics };

    setSubject(updatedSubject);
    persistTopics(updatedSubject, updatedTopics);
  };

  // Toggle visibility or deletion on topic. Only one boolean changes, so these go to the
  // per-topic endpoint rather than resending the whole subject.
  const toggleTopicFlag = (id: Uuid, flag: TopicFlag) => {
    if (!subject) return;

    const topic = subject.topics.find((t) => t.id === id);

    if (!topic) return;

    const value = !topic[flag];

    setSubject({
      ...subject,
      topics: subject.topics.map((t) =>
        t.id === id ? { ...t, [flag]: value } : t
      ),
    });
    setSaveError(null);

    updateTopicState(subject.id, id, {
      [flag]: value,
    }).catch((err: unknown) => {
      console.error(err);
      setSaveError(sr.pages.subject.saveFailed);
    });
  };

  const handleToggleTopicVisibility = (id: Uuid) => toggleTopicFlag(id, "isHidden");

  const handleToggleTopicDeletion = (id: Uuid) => toggleTopicFlag(id, "isDeleted");

  // Add a new topic to the subject
  const handleSaveNewTopic = () => {
    if (!subject || !newTitle.trim()) return;

    const topic = newTopic(
      newTitle,
      newDescription,
      toMaterials(newMaterials),
      subject.topics.length
    );

    const updatedTopics = [...subject.topics, topic];
    const updatedSubject = { ...subject, topics: updatedTopics };

    setSubject(updatedSubject);
    persistTopics(updatedSubject, updatedTopics);

    setShowAddModal(false);
  };

  // Move topic ordering
  const moveTopic = (from: number, to: number) => {
    if (!subject || to < 0 || to >= subject.topics.length) return;

    const reordered = [...subject.topics];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

    // The server derives Order from position in the list; keep the local copy in step.
    const updatedTopics = reordered.map((topic, i) => ({ ...topic, order: i }));

    setSubject({ ...subject, topics: updatedTopics });
    setSaveError(null);

    // Only the order changed, so this goes to the dedicated endpoint rather than resending
    // the whole subject.
    updateTopicOrder(
      subject.id,
      updatedTopics.map((topic) => topic.id)
    ).catch((err: unknown) => {
      console.error(err);
      setSaveError(sr.pages.subject.saveFailed);
    });
  };

  const handleMoveUp = (index: number) => moveTopic(index, index - 1);

  const handleMoveDown = (index: number) => moveTopic(index, index + 1);

  // An id that matches no subject used to render a blank page and then throw on
  // subject.title. Same treatment the home page gives a route it cannot serve.
  if (!loading && !subject) return <Navigate to="/home" replace />;

  return (
    <div className={styles.container}>
      <Navbar onLogout={onLogout} />
      <div className={styles.contentWrapper}>
        <Sidebar subjects={subjects} loading={loading} />

        {loading || !subject ? (
          <div />
        ) : (
          <main className={styles.main}>
            <div className={styles.pageHeader}>
              <h1>{subject.title}</h1>
              <SubjectCard
                id={subject.id}
                title={subject.title}
                code={subject.code}
                level={subject.level}
                semester={subject.semester}
                lecturerUsername={subject.lecturer}
                assistantUsername={subject.assistant}
                isActive={subject.isActive}
                isSingleCard={true}
              />
            </div>

            {saveError && (
              <p role="alert" className={subjectPageStyles.saveError}>
                {saveError}
              </p>
            )}

            <div className={subjectPageStyles.pageContent}>
              <div className={subjectPageStyles.cardGrid}>
                {subject.topics
                  .filter((t) => user || (!t.isHidden && !t.isDeleted))
                  .map((topic, index, visibleTopics) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      index={index}
                      total={visibleTopics.length}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onEdit={handleTopicEdit}
                      onToggleVisibility={handleToggleTopicVisibility}
                      onToggleDeletion={handleToggleTopicDeletion}
                    />
                  ))}
              </div>

              {user && (
                <button
                  className={subjectPageStyles.addTopicButton}
                  onClick={() => {
                    setNewTitle("");
                    setNewDescription("");
                    setNewMaterials([]);
                    setShowAddModal(true);
                  }}
                >
                  {sr.pages.subject.buttons.addTopic}
                </button>
              )}
            </div>

            <footer className={styles.footer}>{footerText}</footer>
          </main>
        )}
      </div>

      {showAddModal && (
        <TopicModal
          title={newTitle}
          description={newDescription}
          materials={newMaterials}
          onTitleChange={setNewTitle}
          onDescriptionChange={setNewDescription}
          onMaterialChange={handleNewMaterialChange}
          onAddMaterial={handleAddNewMaterial}
          onRemoveMaterial={handleRemoveNewMaterial}
          onSave={handleSaveNewTopic}
          onCancel={() => setShowAddModal(false)}
          cpt={sr.components.cards.topic}
        />
      )}
    </div>
  );
};

export default SubjectPage;
