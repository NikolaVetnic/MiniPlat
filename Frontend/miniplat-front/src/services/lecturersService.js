const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchLecturer = async (username) => {
  const response = await fetch(`${API_BASE_URL}/api/Lecturers/${username}`, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok)
    throw new Error(`Failed to fetch subjects: ${response.status}`);

  const data = await response.json();
  return data.lecturer || [];
};
