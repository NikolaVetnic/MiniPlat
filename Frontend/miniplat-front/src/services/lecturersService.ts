import type {
  GetLecturerResponse,
  LecturerDetails,
  LecturerSummary,
  ListLecturersResponse,
} from "../types/api";
import { authHeaders } from "./authHeaders";
import { dropSessionIfRejected } from "./unauthorized";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchLecturer = async (
  username: string
): Promise<LecturerDetails | null> => {
  // Encoded rather than interpolated raw: a username carrying a slash or a question mark
  // would otherwise change which route is called rather than which lecturer is asked for.
  const response = await fetch(
    `${API_BASE_URL}/api/Lecturers/${encodeURIComponent(username)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );

  if (!response.ok) {
    dropSessionIfRejected(response);
    throw new Error(`Failed to fetch lecturer: ${response.status}`);
  }

  const data = (await response.json()) as GetLecturerResponse;

  // Was `|| []` - an empty array standing in for a missing object, which then read as
  // present everywhere downstream because [] is truthy. A missing lecturer is null.
  return data.lecturer ?? null;
};

// The in-flight request is shared instead of fired once per SubjectCard that enters edit mode.
let lecturersPromise: Promise<LecturerSummary[]> | null = null;

export const fetchLecturers = async (): Promise<LecturerSummary[]> => {
  if (lecturersPromise) return lecturersPromise;

  lecturersPromise = fetch(`${API_BASE_URL}/api/Lecturers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        dropSessionIfRejected(response);
        throw new Error(`Failed to fetch lecturers: ${response.status}`);
      }

      const data = (await response.json()) as ListLecturersResponse;
      return data.lecturers ?? [];
    })
    .catch((err: unknown) => {
      lecturersPromise = null; // let the next attempt retry
      throw err;
    });

  return lecturersPromise;
};
