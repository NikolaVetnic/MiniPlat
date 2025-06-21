// SubjectPage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchSubjects,
  updateSubjectTopics,
} from "../../services/subjectsService";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import sr from "../../locales/sr.json";
import styles from "../Home/HomePage.module.css";
import SubjectCard from "../../components/Cards/Subject/SubjectCard";
import subjectPageStyles from "./SubjectPage.module.css";
import TopicCard from "../../components/Cards/Topic/TopicCard";
import TopicModal from "../../components/Modals/Topic/TopicModal";
import footerText from "../../utils/footerText";

const SubjectPage = ({ user, onLogout }) => {
  const { subjectId } = useParams();

  // State for subject and subjects list
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Modal state and topic inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaterials, setNewMaterials] = useState([]);

  // Used to debounce topic updates
  const debounceTimeout = useRef();

  // Fetch all subjects and select current one
  useEffect(() => {
    const getSubjects = async () => {
      setLoading(true);
      try {
        const data = await fetchSubjects();
        setSubjects(data);
        setSubject(data.find((s) => s.id === subjectId));
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    getSubjects();
  }, [subjectId]);

  // Handlers for material inputs in modal
  const handleNewMaterialChange = (index, field, value) => {
    setNewMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };
  const handleAddNewMaterial = () =>
    setNewMaterials((prev) => [...prev, { description: "", link: "" }]);
  const handleRemoveNewMaterial = (index) =>
    setNewMaterials((prev) => prev.filter((_, i) => i !== index));

  // Save edited topic
  const handleTopicEdit = (updatedTopic) => {
    setSubject((prev) => {
      if (!prev) return prev;
      const updatedTopics = prev.topics.map((t) =>
        t.id === updatedTopic.id ? updatedTopic : t
      );
      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  // Toggle visibility or deletion on topic
  const handleToggleTopicVisibility = (id) => {
    setSubject((prev) => {
      const updatedTopics = prev.topics.map((t) =>
        t.id === id ? { ...t, isHidden: !t.isHidden } : t
      );
      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  const handleToggleTopicDeletion = (id) => {
    setSubject((prev) => {
      const updatedTopics = prev.topics.map((t) =>
        t.id === id ? { ...t, isDeleted: !t.isDeleted } : t
      );
      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  // Add a new topic to the subject
  const handleSaveNewTopic = () => {
    if (!newTitle.trim()) return;

    const generateGuid = () => crypto.randomUUID();
    const materials = newMaterials
      .filter((m) => m.description.trim() || m.link.trim())
      .map((m, i) => ({ ...m, id: m.id || generateGuid(), order: i }));

    const newTopic = {
      id: generateGuid(),
      title: newTitle,
      description: newDescription,
      materials,
      lastModifiedAt: new Date().toISOString(),
      isHidden: false,
      isDeleted: false,
    };

    setSubject((prev) => {
      const updatedTopics = [...(prev?.topics || []), newTopic];
      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });

    setShowAddModal(false);
  };

  // Move topic ordering
  const handleMoveUp = (index) => {
    if (index === 0 || !subject?.topics) return;
    const newTopics = [...subject.topics];
    [newTopics[index - 1], newTopics[index]] = [
      newTopics[index],
      newTopics[index - 1],
    ];
    setSubject((prev) => ({ ...prev, topics: newTopics }));
  };

  const handleMoveDown = (index) => {
    if (!subject?.topics || index >= subject.topics.length - 1) return;
    const newTopics = [...subject.topics];
    [newTopics[index], newTopics[index + 1]] = [
      newTopics[index + 1],
      newTopics[index],
    ];
    setSubject((prev) => ({ ...prev, topics: newTopics }));
  };

  return (
    <div className={styles.container}>
      <Navbar user={user} onLogout={onLogout} />
      <div className={styles.contentWrapper}>
        <Sidebar subjects={subjects} user={user} loading={loading} />

        {loading ? (
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
