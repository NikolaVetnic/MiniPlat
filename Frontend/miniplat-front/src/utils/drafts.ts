import type { Material, Topic, Uuid } from "../types/api";
import type { MaterialDraft } from "../types/app";

/**
 * Turns what the editor holds into what the API expects.
 *
 * The server recreates every topic and material row on save and fills in the audit fields
 * itself, so the nulls below are what a browser-built row legitimately carries. Order is
 * likewise derived server-side from list position; the value here just keeps the local copy
 * in step until the next read.
 */

const newId = (): Uuid => crypto.randomUUID();

const AUDIT_DEFAULTS = {
  isDeleted: false,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: null,
  lastModifiedBy: null,
};

export const toMaterial = (
  draft: MaterialDraft | Material,
  order: number
): Material => ({
  ...AUDIT_DEFAULTS,
  ...draft,
  id: draft.id ?? newId(),
  order,
});

/** Drops rows the user left entirely blank, then renumbers what survives. */
export const toMaterials = (
  drafts: Array<MaterialDraft | Material>
): Material[] =>
  drafts
    .filter(
      (material) =>
        material.description.trim() !== "" || material.link.trim() !== ""
    )
    .map((material, index) => toMaterial(material, index));

/** A topic created in the browser, complete enough to be sent as part of the subject. */
export const newTopic = (
  title: string,
  description: string,
  materials: Material[],
  order: number
): Topic => ({
  ...AUDIT_DEFAULTS,
  id: newId(),
  title,
  description,
  order,
  materials,
  isHidden: false,
  deletedAt: null,
  lastModifiedAt: new Date().toISOString(),
});
