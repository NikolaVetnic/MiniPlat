import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLecturer } from "../services/lecturersService";

export const useSubjectPeople = (lecturerUsername, assistantUsername) => {
  const [lecturer, setLecturer] = useState(null);
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Each load claims a sequence number and only writes state if it is still the newest one.
  // A ref rather than an effect-scoped flag, because refetch is called from outside the effect
  // and its result races with the effect's just the same.
  const latestRequest = useRef(0);

  const load = useCallback(async (lecturerName, assistantName) => {
    const requestId = ++latestRequest.current;
    setLoading(true);

    try {
      const [lecturerData, assistantData] = await Promise.all([
        lecturerName ? fetchLecturer(lecturerName) : Promise.resolve(null),
        assistantName ? fetchLecturer(assistantName) : Promise.resolve(null),
      ]);

      if (requestId !== latestRequest.current) return;

      setLecturer(lecturerData);
      setAssistant(assistantData);
      setError(null); // a success clears a previous failure
    } catch (err) {
      console.error(err);

      if (requestId !== latestRequest.current) return;

      setError("Unable to fetch lecturer information.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(lecturerUsername, assistantUsername);
  }, [lecturerUsername, assistantUsername, load]);

  return { lecturer, assistant, loading, error, refetch: load };
};
