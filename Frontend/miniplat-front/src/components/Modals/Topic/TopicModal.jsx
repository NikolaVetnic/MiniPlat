import { FiTrash2 } from "react-icons/fi";
import styles from "./TopicModal.module.css"; // adjust path as needed

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
  cpt, // pass your captions object if needed
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{title ? cpt?.titles?.update : cpt?.titles?.create}</h3>
        <label>
          <p>Naslov:</p>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </label>
        <label>
          <p>{cpt?.description}:</p>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </label>

        <div className={styles.materialsSection}>
          <p>{cpt?.materials}:</p>
          {materials.map((material, index) => (
            <div key={index} className={styles.materialItem}>
              <input
                type="text"
                placeholder={cpt?.description}
                value={material.description}
                onChange={(e) =>
                  onMaterialChange(index, "description", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Link"
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
          <button onClick={onAddMaterial} className={styles.addMaterialButton}>
            {cpt?.buttons?.addMaterial}
          </button>
        </div>

        <div className={styles.modalButtons}>
          <button onClick={onSave}>{cpt?.buttons?.save}</button>
          <button onClick={onCancel}>{cpt?.buttons?.cancel}</button>
        </div>
      </div>
    </div>
  );
};

export default TopicModal;
