import { format } from "../../i18n/dictionaries";
import type { SidebarCaptions } from "../../i18n/types";
import type { Subject } from "../../types/api";
import type { SessionUser } from "../../types/app";

/**
 * Grupperings- og etikettlogikken fra Sidebar, holdt utenfor komponenten så den kan
 * testes uten å rendre noe.
 */

/** Emner brukeren skal se: egne emner for nastavno osoblje, alle for admin og anonyme. */
export const visibleSubjects = (
  subjects: Subject[],
  user: SessionUser | null,
  adminUsername: string
): Subject[] =>
  subjects.filter((subject) => {
    const isUserRelated =
      !user ||
      user.username === subject.lecturer ||
      user.username === subject.assistant ||
      user.username === adminUsername;

    return isUserRelated && subject.isActive;
  });

/** Nøkkelen er `${level}-${semester}`, og emnene i gruppen beholder API-rekkefølgen. */
export type SubjectGroup = [key: string, subjects: Subject[]];

export const groupSubjects = (subjects: Subject[]): SubjectGroup[] => {
  const grouped: Record<string, Subject[]> = {};

  subjects.forEach((subject) => {
    const key = `${subject.level}-${subject.semester}`;
    (grouped[key] ??= []).push(subject);
  });

  // Nøkkelen bærer begge sorteringsfeltene, så to ulike grupper skiller seg alltid på
  // ett av dem. Et tredje kriterium på 'order' sto her før; det kunne aldri kjøre.
  return Object.entries(grouped).sort(([a], [b]) => {
    const [aLevel, aSemester] = a.split("-").map(Number);
    const [bLevel, bSemester] = b.split("-").map(Number);

    return aLevel - bLevel || aSemester - bSemester;
  });
};

/** Bygger «OSS • II godina • Zimski semestar» fra gruppenøkkelen. */
export const groupLabel = (groupKey: string, cpt: SidebarCaptions): string => {
  // Var strengaritmetikk: level og semester kom rett fra split() og ble regnet på
  // via implisitt konvertering, noe TypeScript med rette avviser.
  const [level, semester] = groupKey.split("-").map(Number);

  const cptLevel = cpt.levels[level - 1];
  const cptYear = format(cpt.yearLabel, {
    year: cpt.years[Math.floor((semester - 1) / 2)],
  });
  const cptSemester = cpt.semester[semester % 2];

  return `${cptLevel} • ${cptYear} • ${cptSemester}`;
};
