import { useEffect, useState } from "react";

import type { LecturerSummary } from "../types/api";
import { fetchLecturers } from "../services/lecturersService";

export interface UseLecturersResult {
  lecturers: LecturerSummary[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the staff roster used by the subject editor's dropdowns. Pass enabled=false
 * to keep it from requesting anything until the editor is actually opened.
 */
export const useLecturers = (enabled = true): UseLecturersResult => {
  const [lecturers, setLecturers] = useState<LecturerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);

    fetchLecturers()
      .then((data) => {
        if (!cancelled) setLecturers(data);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setError("Unable to fetch lecturer list.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { lecturers, loading, error };
};
