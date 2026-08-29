import { saveAs } from "file-saver";
import yaml from "js-yaml";

import { Level, type Subject, type Uuid } from "../types/api";

interface YamlMaterial {
  id: Uuid;
  description: string;
  link: string;
  order: number;
}

interface YamlTopic {
  id: Uuid;
  title: string;
  description: string;
  order: number;
  materials: YamlMaterial[];
}

interface YamlSubject {
  id: Uuid;
  code: string;
  title: string;
  description: string;
  level: "Undergraduate" | "Master";
  semester: number;
  lecturer: string;
  assistant: string;
  topics: YamlTopic[];
  isActive: boolean;
}

export interface YamlDocument {
  subjects: YamlSubject[];
}

/**
 * Formen dumpen har på disk. Skilt fra nedlastingen slik at den kan testes uten å
 * stubbe saveAs - dette er admin-synlig output, og en stille endring i feltnavn eller
 * nivå-mapping ville ingen oppdaget.
 *
 * Bevisst et eget sett med typer og ikke Subject: dumpen deles, og version, isDeleted
 * og revisjonsfeltene skal ikke være med.
 */
export function toYamlDocument(subjects: Subject[]): YamlDocument {
  return {
    subjects: subjects.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      description: s.description,
      level: s.level === Level.Undergraduate ? "Undergraduate" : "Master",
      semester: s.semester,
      lecturer: s.lecturer || "",
      assistant: s.assistant || "",
      // Vaktene mot manglende lister er beholdt: typene lover at de finnes, men et
      // avkortet svar skal ikke velte admin-dumpen.
      topics: (s.topics || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        order: t.order,
        materials: (t.materials || []).map((m) => ({
          id: m.id,
          description: m.description,
          link: m.link,
          order: m.order,
        })),
      })),
      isActive: s.isActive,
    })),
  };
}

export function formatSubjectsYaml(subjects: Subject[]): string {
  return yaml.dump(toYamlDocument(subjects), { noRefs: true, lineWidth: -1 });
}

/** Tidspunktet injiseres slik at filnavnet lar seg teste. */
export function yamlFilename(now: Date = new Date()): string {
  const timestamp = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\..+/, "");

  return `subjects_${timestamp}.yaml`;
}

export function downloadSubjectsYaml(subjects: Subject[]): void {
  const blob = new Blob([formatSubjectsYaml(subjects)], {
    type: "text/yaml;charset=utf-8",
  });

  saveAs(blob, yamlFilename());
}
