import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import sr from "../../locales/sr.json";
import styles from "../Home/HomePage.module.css"; // Reuse HomePage styles
import subjectPageStyles from "./SubjectPage.module.css";
import TopicCard from "../../components/Cards/Topic/TopicCard";
import TopicModal from "../../components/Modals/Topic/TopicModal";

import footerText from "../../utils/footerText";
import subjectsDummyData from "../../data/subjectsDummyData";

const SubjectPage = ({ user, onLogout }) => {
  const { subjectId } = useParams();

  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaterials, setNewMaterials] = useState([]);

  // Fetch subjects on mount (mock API call)
  useEffect(() => {
    const fetchSubjects = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubjects(subjectsDummyData);
    };
    fetchSubjects();
  }, []);

  const subject = subjectsDummyData.find(
    (subj) => subj.id === decodeURIComponent(subjectId)
  );
  const subjectTitle = subject ? subject.title : decodeURIComponent(subjectId);

  // Fetch topics whenever subjectId changes
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true); // immediately activate spinner on subject change
      await new Promise((resolve) => setTimeout(resolve, 500));
      const subject = subjectsDummyData.find(
        (subj) => subj.id === decodeURIComponent(subjectId)
      );
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

          <main className={styles.main}>
            <div className={styles.pageHeader}>
              <h1>{subjectTitle}</h1>
            </div>

            <div className={styles.pageContent}>
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
