import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchSubjects,
  updateSubjectTopics,
} from "../../services/subjectsService";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import sr from "../../locales/sr.json";
import styles from "../Home/HomePage.module.css"; // Reuse HomePage styles
import SubjectCard from "../../components/Cards/Subject/SubjectCard";
import subjectPageStyles from "./SubjectPage.module.css";
import TopicCard from "../../components/Cards/Topic/TopicCard";
import TopicModal from "../../components/Modals/Topic/TopicModal";

import footerText from "../../utils/footerText";

const SubjectPage = ({ user, onLogout }) => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const debounceTimeout = useRef();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaterials, setNewMaterials] = useState([]);

  useEffect(() => {
    const getSubjects = async () => {
      setLoading(true);
      try {
        const subjectsData = await fetchSubjects();
        setSubjects(subjectsData);

        const selectedSubject = subjectsData.find((s) => s.id === subjectId);
        setSubject(selectedSubject);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    getSubjects();
  }, [subjectId]);

  useEffect(() => {
    if (
      !localStorage.getItem("token") ||
      !subject?.topics ||
      subject.topics.length === 0
    )
      return;

    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      updateSubjectTopics(subject, subject.topics);
    }, 300);
  }, [subject?.topics]);

  const handleNewMaterialChange = (index, field, value) => {
    setNewMaterials((prev) =>
      prev.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    );
  };

  const handleAddNewMaterial = () => {
    setNewMaterials((prev) => [...prev, { description: "", link: "" }]);
  };

  const handleRemoveNewMaterial = (index) => {
    setNewMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTopicEdit = (updatedTopic) => {
    setSubject((prevSubject) => {
      if (!prevSubject) return prevSubject;

      const updatedTopics = prevSubject.topics.map((t) =>
        t.id === updatedTopic.id ? updatedTopic : t
      );

      const updatedSubject = {
        ...prevSubject,
        topics: updatedTopics,
      };

      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  const handleToggleTopicVisibility = (topicId) => {
    setSubject((prev) => {
      if (!prev) return prev;

      const updatedTopics = prev.topics.map((t) =>
        t.id === topicId ? { ...t, isHidden: !t.isHidden } : t
      );

      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  const handleToggleTopicDeletion = (topicId) => {
    setSubject((prev) => {
      if (!prev) return prev;

      const updatedTopics = prev.topics.map((t) => {
        if (t.id !== topicId) return t;

        const isNowDeleted = t.isDeleted;

        return {
          ...t,
          isDeleted: !isNowDeleted,
        };
      });

      const updatedSubject = { ...prev, topics: updatedTopics };
      updateSubjectTopics(updatedSubject, updatedTopics);
      return updatedSubject;
    });
  };

  const handleSaveNewTopic = () => {
    if (newTitle.trim() === "") return;

    const generateGuid = () => crypto.randomUUID(); // Browser-supported

    const filteredMaterials = newMaterials
      .filter(
        (material) =>
          material.description.trim() !== "" || material.link.trim() !== ""
      )
      .map((material, index) => ({
        ...material,
        id: material.id || generateGuid(),
        order: index,
      }));

    const newTopic = {
      id: generateGuid(), // Assign new topic ID
      title: newTitle,
      description: newDescription,
      materials: filteredMaterials,
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
    <>
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
                  code={subject.code}
                  lecturerUsername={subject.lecturer}
                  assistantUsername={subject.assistant}
                />
                <p>{subject.description}</p>
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
    </>
  );
};

export default SubjectPage;
