import { useEffect, useState } from "react";
import { fetchLecturers } from "../services/lecturersService";

/**
 * Loads the staff roster used by the subject editor's dropdowns. Pass enabled=false
 * to keep it from requesting anything until the editor is actually opened.
 */
export const useLecturers = (enabled = true) => {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);

    fetchLecturers()
      .then((data) => {
        if (!cancelled) setLecturers(data);
      })
      .catch((err) => {
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
