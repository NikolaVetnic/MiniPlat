import type {
  ListSubjectsResponse,
  Subject,
  Topic,
  UpdateTopicStateRequest,
  Uuid,
} from "../types/api";
import { authHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 409 from the server: someone else saved first, and the version token the caller read is
 * stale. Its own class rather than a flag hung on Error, so the page can tell the two apart
 * with instanceof instead of reaching for a property that only exists sometimes.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

const jsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...authHeaders(),
});

export const fetchSubjects = async (): Promise<Subject[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/Subjects?pageIndex=0&pageSize=1000`,
    {
      method: "GET",
      headers: jsonHeaders(),
    }
  );

  if (!response.ok)
    throw new Error(`Failed to fetch subjects: ${response.status}`);

  const data = (await response.json()) as ListSubjectsResponse;
  return data.subjects.data ?? [];
};

/**
 * Sends the whole subject graph. The server replaces every topic and material row, and
 * derives each topic's order from its position in the list, so the order values carried
 * here are informational only.
 */
export const updateSubjectTopics = async (
  subject: Subject,
  updatedTopics: Topic[]
): Promise<void> => {
  const updatedSubject: Subject = {
    ...subject,
    topics: updatedTopics,
  };

  const res = await fetch(`${API_BASE_URL}/api/Subjects/${subject.id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(updatedSubject),
  });

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);

    if (res.status === 409) {
      throw new ConflictError(`Subject ${subject.id} was changed by someone else`);
    }

    throw new Error(`Failed to update subject ${subject.id}`);
  }
};

/**
 * Persists topic order only. Cheaper than updateSubjectTopics, which sends the whole graph
 * and makes the server delete and recreate every topic and material.
 */
export const updateTopicOrder = async (
  subjectId: Uuid,
  topicIds: Uuid[]
): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/api/Subjects/${subjectId}/topics/order`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ topicIds }),
    }
  );

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
export const updateTopicState = async (
  subjectId: Uuid,
  topicId: Uuid,
  changes: UpdateTopicStateRequest
): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/api/Subjects/${subjectId}/topics/${topicId}`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
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
export const updateSubjectPeople = async (
  id: Uuid,
  lecturer: string,
  assistant: string | null
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/Subjects/${id}/staff`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({ lecturer, assistant: assistant || null }),
  });

  if (!res.ok) {
    const text = await res.text();

    console.error("Server response:", text);
    throw new Error(`Failed to update staff on subject ${id}`);
  }
};
