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

    // 409 means someone else saved first; the page needs to say so rather than
    // report a generic failure.
    const error = new Error(`Failed to update subject ${subject.id}`);
    error.isConflict = res.status === 409;

    throw error;
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

/**
 * Flips a topic's hidden or deleted flag. Like updateTopicOrder, this avoids resending the
 * whole subject just to change one boolean. Omitted flags are left as they are.
 */
export const updateTopicState = async (subjectId, topicId, changes) => {
  const res = await fetch(
    `${API_BASE_URL}/api/Subjects/${subjectId}/topics/${topicId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(changes),
    }
  );

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);
    throw new Error(`Failed to update topic ${topicId}`);
  }
};

/**
 * Assigns the lecturer and assistant. Pass null as the assistant to remove them - the general
 * subject update cannot express that, because there null means "leave this field alone".
 */
export const updateSubjectPeople = async (id, lecturer, assistant) => {
  const res = await fetch(`${API_BASE_URL}/api/Subjects/${id}/staff`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ lecturer, assistant: assistant || null }),
  });

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);
    throw new Error(`Failed to update staff on subject ${id}`);
  }
};
