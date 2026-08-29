import { FiBook } from "react-icons/fi";
import { useState } from "react";

import { formatDate } from "../../../utils/formatDate";
import { toMaterials } from "../../../utils/drafts";
import styles from "./TopicCard.module.css";
import TopicModal, {
  type MaterialField,
} from "../../Modals/Topic/TopicModal";
import type { Material, Topic, Uuid } from "../../../types/api";
import type { MaterialDraft } from "../../../types/app";
import { useUser } from "../../../contexts/UserContext";
import { safeLink } from "../../../utils/safeLink";
import { useI18n } from "../../../i18n/I18nContext";

interface TopicCardProps {
  topic: Topic;
  index: number;
  total: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit?: (topic: Topic) => void;
  onToggleVisibility: (id: Uuid) => void;
  onToggleDeletion: (id: Uuid) => void;
}

const TopicCard = ({
  topic,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onEdit,
  onToggleVisibility,
  onToggleDeletion,
}: TopicCardProps) => {
  const [showModal, setShowModal] = useState(false);

  // editable fields
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description);
  const [editedMaterials, setEditedMaterials] = useState<
    Array<Material | MaterialDraft>
  >(topic.materials);

  const { user } = useUser();
  const { t } = useI18n();

  const handleAddMaterial = () => {
    setEditedMaterials((prev) => [...prev, { description: "", link: "" }]);
  };

  const handleMaterialChange = (
    index: number,
    field: MaterialField,
    value: string
  ) => {
    setEditedMaterials((prev) =>
      prev.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    );
  };

  const handleRemoveMaterialRow = (index: number) => {
    setEditedMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedTopic: Topic = {
      ...topic,
      title: editedTitle,
      description: editedDescription,
      materials: toMaterials(editedMaterials),
      lastModifiedAt: new Date().toISOString(),
    };

    if (onEdit) {
      onEdit(updatedTopic);
    }

    setShowModal(false);
  };

  const cpt = t.components.cards.topic;

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
                setEditedMaterials(topic.materials);
                setShowModal(true);
              }}
              className={styles.editButton}
            >
              {cpt.buttons.edit}
            </button>

            <button
              onClick={() => onToggleVisibility(topic.id)}
              className={`${styles.hideButton} ${
                topic.isHidden ? styles.showButton : ""
              }`}
            >
              {topic.isHidden ? cpt.buttons.show : cpt.buttons.hide}
            </button>

            <button
              onClick={() => onToggleDeletion(topic.id)}
              className={`${styles.deleteButton} ${
                topic.isDeleted ? styles.putBackButton : ""
              }`}
            >
              {topic.isDeleted ? cpt.buttons.putBack : cpt.buttons.delete}
            </button>
          </div>
        )}
      </div>

      {/* Uten et tidsstempel droppes hele linjen: new Date(null) er epoken, og
          "Ažurirano 1. januar 1970" ser ut som en ekte dato. */}
      {topic.lastModifiedAt && (
        <p className={styles.cardCreatedAt}>
          {cpt.updatedAt} {formatDate(topic.lastModifiedAt, t.locale)}
        </p>
      )}
      <p>{topic.description}</p>

      {topic.materials.length > 0 && (
        <div>
          <p>{cpt.materials}:</p>
          <ul className={styles.materialList}>
            {topic.materials.map((material, index) => {
              const href = safeLink(material.link);

              return (
                <li key={index}>
                  {material.description}:{" "}
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {material.link}
                    </a>
                  ) : (
                    // Shown as plain text rather than a link: an unsupported scheme is not
                    // something a reader should be able to click.
                    <span className={styles.unsafeLink}>{material.link}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {user && (
        <div
          className={`${styles.statusBar} ${
            topic.isHidden && topic.isDeleted
              ? styles.statusDeletedHidden
              : topic.isDeleted
              ? styles.statusDeleted
              : topic.isHidden
              ? styles.statusHidden
              : styles.statusActive
          }`}
        >
          {topic.isHidden && topic.isDeleted && cpt.status.hiddenAndDeleted}
          {!topic.isHidden && topic.isDeleted && cpt.status.deleted}
          {topic.isHidden && !topic.isDeleted && cpt.status.hidden}
          {!topic.isHidden && !topic.isDeleted && cpt.status.active}
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
          cpt={cpt}
        />
      )}
    </div>
  );
};

export default TopicCard;
