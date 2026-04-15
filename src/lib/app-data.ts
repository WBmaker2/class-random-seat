import {
  AppPreferences,
  ClassroomRecord,
  Language,
  LayoutTemplate,
  LocalAppData,
  SeatAssignment,
  SeatPlanRecord,
  StudentRecord,
} from "./types";

const CURRENT_APP_DATA_VERSION = 1;

type InitialSelection = {
  selectedClassId: string;
  selectedSeatPlanId: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLanguage(value: unknown): value is Language {
  return value === "ko" || value === "en";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isLayoutTemplate(value: unknown): value is LayoutTemplate {
  return (
    isRecord(value) &&
    typeof value.rows === "number" &&
    Number.isFinite(value.rows) &&
    typeof value.pairsPerRow === "number" &&
    Number.isFinite(value.pairsPerRow)
  );
}

function isSeatAssignment(value: unknown): value is SeatAssignment {
  return (
    isRecord(value) &&
    isString(value.seatId) &&
    typeof value.row === "number" &&
    Number.isFinite(value.row) &&
    typeof value.pair === "number" &&
    Number.isFinite(value.pair) &&
    (value.side === "left" || value.side === "right") &&
    (value.studentId === null || isString(value.studentId)) &&
    (value.studentName === null || isString(value.studentName)) &&
    (value.gender === null || value.gender === "male" || value.gender === "female")
  );
}

function isClassroomRecord(value: unknown): value is ClassroomRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.memo) &&
    isLayoutTemplate(value.layoutTemplate) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.lastViewedSeatPlanId === undefined || isString(value.lastViewedSeatPlanId))
  );
}

function isStudentRecord(value: unknown): value is StudentRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.gender === "male" || value.gender === "female") &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isSeatPlanRecord(value: unknown): value is SeatPlanRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    (value.assignmentMode === "random" || value.assignmentMode === "mixed_pairs_preferred") &&
    isLayoutTemplate(value.layoutTemplate) &&
    Array.isArray(value.seats) &&
    value.seats.every(isSeatAssignment) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function normalizeClasses(rawClasses: unknown): ClassroomRecord[] {
  if (!Array.isArray(rawClasses)) {
    return [];
  }

  return rawClasses.filter(isClassroomRecord);
}

function normalizeStudentsByClass(
  rawStudentsByClass: unknown,
  classes: ClassroomRecord[],
): Record<string, StudentRecord[]> {
  const record = isRecord(rawStudentsByClass) ? rawStudentsByClass : {};

  return Object.fromEntries(
    classes.map((classroom) => {
      const rawStudents = record[classroom.id];
      const students = Array.isArray(rawStudents) ? rawStudents.filter(isStudentRecord) : [];

      return [classroom.id, students];
    }),
  );
}

function normalizeSeatPlansByClass(
  rawSeatPlansByClass: unknown,
  classes: ClassroomRecord[],
): Record<string, SeatPlanRecord[]> {
  const record = isRecord(rawSeatPlansByClass) ? rawSeatPlansByClass : {};

  return Object.fromEntries(
    classes.map((classroom) => {
      const rawSeatPlans = record[classroom.id];
      const seatPlans = Array.isArray(rawSeatPlans) ? rawSeatPlans.filter(isSeatPlanRecord) : [];

      return [classroom.id, seatPlans];
    }),
  );
}

function normalizeRecentClassId(classes: ClassroomRecord[], recentClassId?: string) {
  if (recentClassId && classes.some((classroom) => classroom.id === recentClassId)) {
    return recentClassId;
  }

  return classes[0]?.id;
}

function normalizeLastViewedSeatPlanId(
  lastViewedSeatPlanId: string | undefined,
  seatPlans: SeatPlanRecord[],
) {
  if (lastViewedSeatPlanId && seatPlans.some((seatPlan) => seatPlan.id === lastViewedSeatPlanId)) {
    return lastViewedSeatPlanId;
  }

  return seatPlans[0]?.id;
}

function normalizePreferences(
  rawPreferences: unknown,
  fallbackLanguage: Language,
  classes: ClassroomRecord[],
): AppPreferences {
  const preferences = isRecord(rawPreferences) ? rawPreferences : {};
  const recentClassId = normalizeRecentClassId(
    classes,
    isString(preferences.recentClassId) ? preferences.recentClassId : undefined,
  );
  const lastBackupAt = isString(preferences.lastBackupAt) ? preferences.lastBackupAt : undefined;
  const lastRestoreAt = isString(preferences.lastRestoreAt) ? preferences.lastRestoreAt : undefined;

  return {
    language: isLanguage(preferences.language) ? preferences.language : fallbackLanguage,
    ...(recentClassId ? { recentClassId } : {}),
    ...(lastBackupAt ? { lastBackupAt } : {}),
    ...(lastRestoreAt ? { lastRestoreAt } : {}),
  };
}

export function createEmptyAppData(language: Language): LocalAppData {
  return {
    version: CURRENT_APP_DATA_VERSION,
    classes: [],
    studentsByClass: {},
    seatPlansByClass: {},
    preferences: {
      language,
    },
  };
}

export function normalizeAppData(raw: unknown, fallbackLanguage: Language): LocalAppData {
  if (!isRecord(raw)) {
    return createEmptyAppData(fallbackLanguage);
  }

  const classes = normalizeClasses(raw.classes);
  const studentsByClass = normalizeStudentsByClass(raw.studentsByClass, classes);
  const seatPlansByClass = normalizeSeatPlansByClass(raw.seatPlansByClass, classes);

  const normalizedClasses = classes.map((classroom) => {
    const lastViewedSeatPlanId = normalizeLastViewedSeatPlanId(
      classroom.lastViewedSeatPlanId,
      seatPlansByClass[classroom.id] ?? [],
    );

    return {
      ...classroom,
      ...(lastViewedSeatPlanId ? { lastViewedSeatPlanId } : {}),
    };
  });

  return {
    version: CURRENT_APP_DATA_VERSION,
    classes: normalizedClasses,
    studentsByClass,
    seatPlansByClass,
    preferences: normalizePreferences(raw.preferences, fallbackLanguage, normalizedClasses),
  };
}

export function deriveInitialSelection(appData: LocalAppData): InitialSelection {
  const selectedClassId =
    appData.preferences.recentClassId &&
    appData.classes.some((classroom) => classroom.id === appData.preferences.recentClassId)
      ? appData.preferences.recentClassId
      : appData.classes[0]?.id ?? "";

  const selectedClass = appData.classes.find((classroom) => classroom.id === selectedClassId);
  const seatPlans = selectedClassId ? appData.seatPlansByClass[selectedClassId] ?? [] : [];
  const selectedSeatPlanId =
    selectedClass?.lastViewedSeatPlanId &&
    seatPlans.some((seatPlan) => seatPlan.id === selectedClass.lastViewedSeatPlanId)
      ? selectedClass.lastViewedSeatPlanId
      : seatPlans[0]?.id ?? "";

  return {
    selectedClassId,
    selectedSeatPlanId,
  };
}
