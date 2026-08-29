/**
 * Grupperings- og etikettlogikken fra Sidebar, trukket ut slik at den kan testes uten å
 * rendre komponenten. Uendret adferd: aritmetikken på strengnøkkelen i groupLabel er
 * bevisst beholdt som den var, slik at testene låser dagens utdata før typene strammes.
 */

/** Emner brukeren skal se: egne emner for nastavno osoblje, alle for admin og anonyme. */
export const visibleSubjects = (subjects, user, adminUsername) =>
  subjects.filter((subject) => {
    const isUserRelated =
      !user ||
      user.username === subject.lecturer ||
      user.username === subject.assistant ||
      user.username === adminUsername;

    return isUserRelated && subject.isActive;
  });

/**
 * Grupperer på nivå og semester og sorterer gruppene. Returnerer [nøkkel, emner]-par
 * i visningsrekkefølge.
 */
export const groupSubjects = (subjects) => {
  const grouped = {};

  subjects.forEach((subject) => {
    const key = `${subject.level}-${subject.semester}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(subject);
  });

  return Object.entries(grouped).sort((a, b) => {
    const [aLevel, aSemester] = a[0].split("-").map(Number);
    const [bLevel, bSemester] = b[0].split("-").map(Number);

    if (aLevel !== bLevel) return aLevel - bLevel;
    if (aSemester !== bSemester) return aSemester - bSemester;

    // Tredje kriterium: laveste 'order' i hver gruppe bryter uavgjort.
    const aOrder = a[1]?.[0]?.order ?? 0;
    const bOrder = b[1]?.[0]?.order ?? 0;
    return aOrder - bOrder;
  });
};

/** Bygger «OSS • II godina • Zimski semestar» fra gruppenøkkelen. */
export const groupLabel = (groupKey, cpt) => {
  const [level, semester] = groupKey.split("-");

  const cptLevel = cpt.levels[level - 1];
  const cptYear = `${cpt.years[Math.floor((semester - 1) / 2)]} godina`;
  const cptSemester = cpt.semester[semester % 2];

  return `${cptLevel} • ${cptYear} • ${cptSemester}`;
};
