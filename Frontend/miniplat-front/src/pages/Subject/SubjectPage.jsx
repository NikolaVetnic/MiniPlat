import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { fetchSubjects } from "../../services/subjectsService";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import sr from "../../locales/sr.json";
import styles from "../Home/HomePage.module.css"; // Reuse HomePage styles
import subjectPageStyles from "./SubjectPage.module.css";
import TopicCard from "../../components/Cards/Topic/TopicCard";
import TopicModal from "../../components/Modals/Topic/TopicModal";

import footerText from "../../utils/footerText";

const SubjectPage = ({ user, onLogout }) => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setSubject(subjectsData.find((s) => s.id === subjectId));
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    getSubjects();
  }, [subjectId]);

  // Fetch topics whenever subjectId changes
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true); // immediately activate spinner on subject change

      await new Promise((resolve) => setTimeout(resolve, 500));

      const subjectData = subject ? subject.topics : [];

      setTopics(subjectData);
      setLoading(false);
    };
    fetchTopics();
  }, [subjectId]);

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

  const handleSaveNewTopic = () => {
    if (newTitle.trim() === "") return;
    const filteredMaterials = newMaterials.filter(
      (material) =>
        material.description.trim() !== "" || material.link.trim() !== ""
    );
    const newTopic = {
      title: newTitle,
      description: newDescription,
      materials: filteredMaterials,
      updatedAt: new Date().toISOString(),
      isHidden: false,
      isDeleted: false,
    };
    setTopics((prev) => [...prev, newTopic]);
    setShowAddModal(false);
  };

  const handleMoveUp = (index) => {
    setTopics((prev) => {
      const newTopics = [...prev];
      [newTopics[index - 1], newTopics[index]] = [
        newTopics[index],
        newTopics[index - 1],
      ];
      return newTopics;
    });
  };

  const handleMoveDown = (index) => {
    setTopics((prev) => {
      const newTopics = [...prev];
      [newTopics[index], newTopics[index + 1]] = [
        newTopics[index + 1],
        newTopics[index],
      ];
      return newTopics;
    });
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
                <p>{subject.description}</p>
              </div>

              <div className={subjectPageStyles.pageContent}>
                {loading ? (
                  <div />
                ) : (
                  <>
                    <div className={subjectPageStyles.cardGrid}>
                      {topics.map((topic, index) => (
                        <TopicCard
                          key={index}
                          topic={topic}
                          index={index}
                          total={topics.length}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
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
                  </>
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
