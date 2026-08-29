import { useState, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";

import styles from "./TopicModal.module.css";
import type { MaterialDraft } from "../../../types/app";
import { useI18n } from "../../../i18n/I18nContext";
import type { TopicCaptions } from "../../../i18n/types";

export type { TopicCaptions };

/** Which material field an edit targets. */
export type MaterialField = "description" | "link";

interface TopicModalProps {
  title: string;
  description: string;
  materials: MaterialDraft[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMaterialChange: (
    index: number,
    field: MaterialField,
    value: string
  ) => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  cpt: TopicCaptions;
}

const TopicModal = ({
  title,
  description,
  materials,
  onTitleChange,
  onDescriptionChange,
  onMaterialChange,
  onAddMaterial,
  onRemoveMaterial,
  onSave,
  onCancel,
  cpt,
}: TopicModalProps) => {
  const { t } = useI18n();
  const [errors, setErrors] = useState({ title: false, description: false });

  useEffect(() => {
    // Reset errors when modal is reopened
    setErrors({ title: false, description: false });
  }, [title, description]);

  const handleSave = () => {
    const hasError = {
      title: !title.trim(),
      description: !description.trim(),
    };

    setErrors(hasError);

    if (!hasError.title && !hasError.description) {
      onSave();
    }
  };

  const cptLocal = t.components.modals.topic;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{title ? cpt.titles.update : cpt.titles.create}</h3>

        <label>
          <p>{cpt.title}:</p>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={errors.title ? styles.inputError : ""}
          />
          {errors.title && (
            <span className={styles.errorText}>
              {cptLocal.errors.titleIsMandatory}
            </span>
          )}
        </label>

        <label>
          <p>{cpt.description}:</p>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className={errors.description ? styles.inputError : ""}
          />
          {errors.description && (
            <span className={styles.errorText}>
              {cptLocal.errors.descriptionIsMandatory}
            </span>
          )}
        </label>

        <div className={styles.materialsSection}>
          <p>{cpt.materials}:</p>
          <div className={styles.materialList}>
            {materials.map((material, index) => (
              <div key={index} className={styles.materialItem}>
                <input
                  type="text"
                  placeholder={cpt.description}
                  value={material.description}
                  onChange={(e) =>
                    onMaterialChange(index, "description", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder={cpt.link}
                  value={material.link}
                  onChange={(e) =>
                    onMaterialChange(index, "link", e.target.value)
                  }
                />
                <button
                  onClick={() => onRemoveMaterial(index)}
                  className={styles.removeMaterialButton}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
          <button onClick={onAddMaterial} className={styles.addMaterialButton}>
            {cpt.buttons.addMaterial}
          </button>
        </div>

        <div className={styles.modalButtons}>
          <button onClick={handleSave}>{cpt.buttons.save}</button>
          <button onClick={onCancel}>{cpt.buttons.cancel}</button>
        </div>
      </div>
    </div>
  );
};

export default TopicModal;
