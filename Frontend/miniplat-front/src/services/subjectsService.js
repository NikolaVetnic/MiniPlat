const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchSubjects = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/Subjects?pageIndex=0&pageSize=1000`,
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

export const fetchSubjectById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/Subjects/${id}`, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subject ${id}`);
  }

  const data = await response.json();
  return data.subject;
};

export const updateSubjectTopics = async (subject, updatedTopics) => {
  const token = localStorage.getItem("token");

  const updatedSubject = {
    ...subject,
    topics: updatedTopics,
  };

  try {
    await fetch(`${API_BASE_URL}/api/Subjects/${subject.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedSubject),
    });
  } catch (error) {
    console.error("Failed to update subject:", error);
  }
};

export const updateSubjectPeople = async (id, lecturer, assistant) => {
  const token = localStorage.getItem("token");

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
        Authorization: `Bearer ${token}`,
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
