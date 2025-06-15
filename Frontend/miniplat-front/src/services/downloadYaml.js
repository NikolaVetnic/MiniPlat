import { saveAs } from "file-saver";
import yaml from "js-yaml";

export function downloadSubjectsYaml(subjects) {
  const formatted = {
    subjects: subjects
      .filter((s) => s.isActive)
      .map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        description: s.description,
        level: s.level === 1 ? "Undergraduate" : "Master",
        semester: s.semester,
        lecturer: s.lecturer || "",
        assistant: s.assistant || "",
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

  const yamlString = yaml.dump(formatted, { noRefs: true, lineWidth: -1 });

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\..+/, "");

  const filename = `subjects_${timestamp}.yaml`;

  const blob = new Blob([yamlString], { type: "text/yaml;charset=utf-8" });
  saveAs(blob, filename);
}
