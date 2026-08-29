/**
 * Formen dataene har over ledningen, speilet fra MiniPlat.Api.
 *
 * Skrevet for hånd i stedet for generert fra /openapi: id-ene er sterkt typede
 * verdiobjekter med egne JsonConverter-klasser som serialiserer til streng, og det
 * ser ikke schema-generatoren. Genererte typer ville gitt objekter der wire-formatet
 * faktisk er en streng.
 */

/** SubjectId, TopicId og MaterialId serialiseres alle som guid-streng. */
export type Uuid = string;

/** ISO-8601, eller null for revisjonsfelter som aldri ble satt. */
export type IsoDateTime = string;

export const Level = {
  Undergraduate: 1,
  Master: 2,
} as const;

export type Level = (typeof Level)[keyof typeof Level];

/** Entity<T> i domenet. Følger med på hvert objekt API-et returnerer. */
export interface AuditFields {
  isDeleted: boolean;
  createdAt: IsoDateTime | null;
  createdBy: string | null;
  lastModifiedAt: IsoDateTime | null;
  lastModifiedBy: string | null;
}

export interface Material extends AuditFields {
  id: Uuid;
  description: string;
  link: string;
  order: number;
}

export interface Topic extends AuditFields {
  id: Uuid;
  title: string;
  description: string;
  order: number;
  materials: Material[];
  isHidden: boolean;
  /** Når temaet ble markert for sletting - starten på oppbevaringsfristen. */
  deletedAt: IsoDateTime | null;
}

export interface Subject extends AuditFields {
  id: Uuid;
  code: string;
  title: string;
  description: string;
  level: Level;
  semester: number;
  order: number;
  lecturer: string;
  /** Tom streng eller null når emnet ikke har assistent. */
  assistant: string | null;
  topics: Topic[];
  isActive: boolean;
  /** Optimistisk låsing, mappet til radens xmin. Sendes tilbake ved oppdatering. */
  version: number;
}

export interface PaginatedResult<T> {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: T[];
}

export interface LecturerSummary {
  username: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface LecturerDetails extends LecturerSummary {
  department: string | null;
  email: string | null;
}

/** /api/Auth/UserInfo. Bygget av claims, så hvert felt kan mangle. */
export interface UserInfo {
  sub: string | null;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  department: string | null;
}

/* -- svarkonvolutter ------------------------------------------------------- */

export interface ListSubjectsResponse {
  subjects: PaginatedResult<Subject>;
}

export interface GetLecturerResponse {
  lecturer: LecturerDetails;
}

export interface ListLecturersResponse {
  lecturers: LecturerSummary[];
}

/** OpenIddict sitt token-svar. Merk snake_case - dette er ikke ASP.NET-serialisering. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface TokenErrorResponse {
  error?: string;
  error_description?: string;
}

/* -- forespørselskropper --------------------------------------------------- */

export interface ReorderTopicsRequest {
  topicIds: Uuid[];
}

/** Utelatt flagg lar serveren la feltet stå som det er. */
export interface UpdateTopicStateRequest {
  isHidden?: boolean;
  isDeleted?: boolean;
}

export interface SetSubjectStaffRequest {
  lecturer: string;
  /** null eller tom streng fjerner assistenten. */
  assistant: string | null;
}
