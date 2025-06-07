export const formatDate = (isoString) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
