import { useEffect, useState } from "react";
import { fetchLecturer } from "../services/lecturersService";

export const useSubjectPeople = (lecturerUsername, assistantUsername) => {
  const [lecturer, setLecturer] = useState(null);
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async (lecturerUsername, assistantUsername) => {
    setLoading(true);
    try {
      const [lecturerData, assistantData] = await Promise.all([
        lecturerUsername
          ? fetchLecturer(lecturerUsername)
          : Promise.resolve(null),
        assistantUsername
          ? fetchLecturer(assistantUsername)
          : Promise.resolve(null),
      ]);
      setLecturer(lecturerData);
      setAssistant(assistantData);
    } catch (err) {
      setError("Unable to fetch lecturer information.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch(lecturerUsername, assistantUsername);
  }, [lecturerUsername, assistantUsername]);

  return { lecturer, assistant, loading, error, refetch };
};
