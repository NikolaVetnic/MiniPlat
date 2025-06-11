const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchSubjects = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/Subjects?pageIndex=0&pageSize=100`,
    {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok)
    throw new Error(`Failed to fetch subjects: ${response.status}`);

  const data = await response.json();
  return data.subjects.data || [];
};
