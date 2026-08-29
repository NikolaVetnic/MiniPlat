import { useCallback, useEffect, useRef, useState } from "react";

import type { LecturerDetails } from "../types/api";
import { fetchLecturer } from "../services/lecturersService";

export type LoadSubjectPeople = (
  lecturerName?: string | null,
  assistantName?: string | null
) => Promise<void>;

export interface UseSubjectPeopleResult {
  lecturer: LecturerDetails | null;
  assistant: LecturerDetails | null;
  loading: boolean;
  error: string | null;
  refetch: LoadSubjectPeople;
}

export const useSubjectPeople = (
  lecturerUsername?: string | null,
  assistantUsername?: string | null
): UseSubjectPeopleResult => {
  const [lecturer, setLecturer] = useState<LecturerDetails | null>(null);
  const [assistant, setAssistant] = useState<LecturerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Each load claims a sequence number and only writes state if it is still the newest one.
  // A ref rather than an effect-scoped flag, because refetch is called from outside the effect
  // and its result races with the effect's just the same.
  const latestRequest = useRef(0);

  const load = useCallback<LoadSubjectPeople>(
    async (lecturerName, assistantName) => {
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
    },
    []
  );

  useEffect(() => {
    void load(lecturerUsername, assistantUsername);
  }, [lecturerUsername, assistantUsername, load]);

  return { lecturer, assistant, loading, error, refetch: load };
};
