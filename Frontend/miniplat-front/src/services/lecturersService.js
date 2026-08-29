import { authHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchLecturer = async (username) => {
  const response = await fetch(`${API_BASE_URL}/api/Lecturers/${username}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok)
    throw new Error(`Failed to fetch subjects: ${response.status}`);

  const data = await response.json();
  return data.lecturer || [];
};

// The in-flight request is shared instead of fired once per SubjectCard that enters edit mode.
let lecturersPromise = null;

export const fetchLecturers = async () => {
  if (lecturersPromise) return lecturersPromise;

  const token = localStorage.getItem("token");

  lecturersPromise = fetch(`${API_BASE_URL}/api/Lecturers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      if (!response.ok)
        throw new Error(`Failed to fetch lecturers: ${response.status}`);

      const data = await response.json();
      return data.lecturers || [];
    })
    .catch((err) => {
      lecturersPromise = null; // let the next attempt retry
      throw err;
    });

  return lecturersPromise;
};
