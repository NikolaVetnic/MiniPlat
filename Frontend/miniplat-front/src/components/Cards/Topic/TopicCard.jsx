import { FiBook } from "react-icons/fi";
import { useState } from "react";

import { formatDate } from "../../../utils/formatDate";
import sr from "../../../locales/sr.json";
import styles from "./TopicCard.module.css";
import TopicModal from "../../Modals/Topic/TopicModal";
import { useUser } from "../../../contexts/UserContext";

const TopicCard = ({ topic, index, total, onMoveUp, onMoveDown }) => {
  const [isHidden, setIsHidden] = useState(topic.isHidden || false);
  const [isDeleted, setIsDeleted] = useState(topic.isDeleted || false);
  const [showModal, setShowModal] = useState(false);

  // editable fields
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description);
  const [editedMaterials, setEditedMaterials] = useState(topic.materials || []);

  const { user } = useUser();

  const handleMaterialChange = (index, field, value) => {
    setEditedMaterials((prev) =>
      prev.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    );
  };

  const handleAddMaterial = () => {
    setEditedMaterials((prev) => [...prev, { description: "", link: "" }]);
  };

  const handleRemoveMaterialRow = (index) => {
    setEditedMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const filteredMaterials = editedMaterials.filter(
      (material) =>
        material.description.trim() !== "" || material.link.trim() !== ""
    );

    topic.title = editedTitle;
    topic.description = editedDescription;
    topic.materials = filteredMaterials;
    topic.updatedAt = new Date().toISOString();
    setShowModal(false);
  };

  const cpt = sr.components.cards.topic;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <FiBook className={styles.icon} />
          <span>{topic.title}</span>
        </div>

        {user && (
          <div className={styles.headerRight}>
            {index > 0 && (
              <button
                onClick={() => onMoveUp(index)}
                className={styles.moveButton}
              >
                ↑
              </button>
            )}

            {index < total - 1 && (
              <button
                onClick={() => onMoveDown(index)}
                className={styles.moveButton}
              >
                ↓
              </button>
            )}

            <button
              onClick={() => {
                setEditedTitle(topic.title);
                setEditedDescription(topic.description);
                setEditedMaterials(topic.materials || []);
                setShowModal(true);
              }}
              className={styles.editButton}
            >
              {cpt.buttons.edit}
            </button>

            <button
              onClick={() => setIsHidden(!isHidden)}
              className={`${styles.hideButton} ${
                isHidden ? styles.showButton : ""
              }`}
            >
              {isHidden ? cpt.buttons.show : cpt.buttons.hide}
            </button>

            <button
              onClick={() => setIsDeleted(!isDeleted)}
              className={`${styles.deleteButton} ${
                isDeleted ? styles.putBackButton : ""
              }`}
            >
              {isDeleted ? cpt.buttons.putBack : cpt.buttons.delete}
            </button>
          </div>
        )}
      </div>

      <p className={styles.cardCreatedAt}>
        {cpt.updatedAt} {formatDate(topic.updatedAt)}
      </p>
      <p>{topic.description}</p>

      {topic.materials && topic.materials.length > 0 && (
        <div>
          <p>{cpt.materials}:</p>
          <ul className={styles.materialList}>
            {topic.materials.map((material, index) => (
              <li key={index}>
                {material.description}:{" "}
                <a
                  href={material.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {material.link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user && (
        <div
          className={`${styles.statusBar} ${
            isHidden && isDeleted
              ? styles.statusDeletedHidden
              : isDeleted
              ? styles.statusDeleted
              : isHidden
              ? styles.statusHidden
              : styles.statusActive
          }`}
        >
          {isHidden && isDeleted && cpt.status.hiddenAndDeleted}
          {!isHidden && isDeleted && cpt.status.deleted}
          {isHidden && !isDeleted && cpt.status.hidden}
          {!isHidden && !isDeleted && cpt.status.active}
        </div>
      )}

      {showModal && (
        <TopicModal
          title={editedTitle}
          description={editedDescription}
          materials={editedMaterials}
          onTitleChange={setEditedTitle}
          onDescriptionChange={setEditedDescription}
          onMaterialChange={handleMaterialChange}
          onAddMaterial={handleAddMaterial}
          onRemoveMaterial={handleRemoveMaterialRow}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          cpt={sr.components.cards.topic}
        />
      )}
    </div>
  );
};

export default TopicCard;
