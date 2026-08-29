import { authHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchSubjects = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/Subjects?pageIndex=0&pageSize=1000`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok)
    throw new Error(`Failed to fetch subjects: ${response.status}`);

  const data = await response.json();
  return data.subjects.data || [];
};

export const fetchSubjectById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/Subjects/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subject ${id}`);
  }

  const data = await response.json();
  return data.subject;
};

export const updateSubjectTopics = async (subject, updatedTopics) => {
  const updatedSubject = {
    ...subject,
    topics: updatedTopics,
  };

  const res = await fetch(`${API_BASE_URL}/api/Subjects/${subject.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(updatedSubject),
  });

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);
    throw new Error(`Failed to update subject ${subject.id}`);
  }
};

/**
 * Persists topic order only. Cheaper than updateSubjectTopics, which sends the whole graph
 * and makes the server delete and recreate every topic and material.
 */
export const updateTopicOrder = async (subjectId, topicIds) => {
  const res = await fetch(`${API_BASE_URL}/api/Subjects/${subjectId}/topics/order`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ topicIds }),
  });

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);
    throw new Error(`Failed to reorder topics on subject ${subjectId}`);
  }
};

export const updateSubjectPeople = async (id, lecturer, assistant) => {
  try {
    const subject = await fetchSubjectById(id);

    const updatedSubject = {
      ...subject,
      lecturer,
      assistant,
    };

    const res = await fetch(`${API_BASE_URL}/api/Subjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(updatedSubject),
    });

    if (!res.ok) {
      const text = await res.text();

      console.error("Server response:", text);
      throw new Error(`Failed to update subject ${id}`);
    }
  } catch (error) {
    console.error("Failed to update subject:", error);
    throw error;
  }
};
