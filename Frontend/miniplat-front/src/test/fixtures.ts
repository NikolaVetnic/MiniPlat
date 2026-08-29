import { Level, type Material, type Subject, type Topic } from "../types/api";

/**
 * Complete objects in the shape the API returns, so tests do not have to repeat the
 * audit fields. Only imported from test files, so none of this reaches the bundle.
 */

export const makeMaterial = (over: Partial<Material> = {}): Material => ({
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  description: "Skripta",
  link: "https://example.com/skripta.pdf",
  order: 0,
  isDeleted: false,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: null,
  lastModifiedBy: null,
  ...over,
});

export const makeTopic = (over: Partial<Topic> = {}): Topic => ({
  id: "bbbbbbbb-0000-0000-0000-000000000001",
  title: "Tema",
  description: "Opis teme",
  order: 0,
  materials: [],
  isHidden: false,
  deletedAt: null,
  isDeleted: false,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: "2026-08-29T12:00:00.000Z",
  lastModifiedBy: null,
  ...over,
});

export const makeSubject = (over: Partial<Subject> = {}): Subject => ({
  id: "cccccccc-0000-0000-0000-000000000001",
  code: "PSI-101",
  title: "Psihologija",
  description: "Opis predmeta",
  level: Level.Undergraduate,
  semester: 1,
  order: 0,
  lecturer: "pnikolic",
  assistant: "mmarkovic",
  topics: [],
  isActive: true,
  version: 1,
  isDeleted: false,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: null,
  lastModifiedBy: null,
  ...over,
});
