import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { normalizeAppData } from "@/lib/app-data";
import {
  ClassDraft,
  CloudBackupEnvelope,
  ClassroomRecord,
  Language,
  LocalAppData,
  SeatPlanRecord,
  StudentDraft,
  StudentRecord,
  UserProfile,
} from "@/lib/types";

export const CLOUD_BACKUP_SCHEMA_VERSION = 1;

type UnknownRecord = Record<string, unknown>;

function sanitizeFirestoreValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, nestedValue]) => {
        const sanitizedValue = sanitizeFirestoreValue(nestedValue);

        return sanitizedValue === undefined ? [] : [[key, sanitizedValue]];
      }),
    );
  }

  return value;
}

function sanitizeFirestoreObject<T extends object>(value: T) {
  return sanitizeFirestoreValue(value) as T;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function getNow() {
  return new Date().toISOString();
}

function getDbOrThrow() {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return db;
}

function userDoc(uid: string) {
  return doc(getDbOrThrow(), "users", uid);
}

function classDoc(uid: string, classId: string) {
  return doc(userDoc(uid), "classes", classId);
}

function studentDoc(uid: string, classId: string, studentId: string) {
  return doc(classDoc(uid, classId), "students", studentId);
}

function extractBackupPayload(raw: unknown) {
  if (!isRecord(raw)) {
    return null;
  }

  if (isRecord(raw.appData)) {
    return raw.appData;
  }

  if ("version" in raw && "classes" in raw) {
    return raw;
  }

  return null;
}

export function normalizeCloudBackup(
  raw: unknown,
  fallbackLanguage: Language,
): CloudBackupEnvelope | null {
  const payload = extractBackupPayload(raw);

  if (!payload) {
    return null;
  }

  const appData = normalizeAppData(payload, fallbackLanguage);
  const rawRecord = isRecord(raw) ? raw : {};
  const savedAt = isString(rawRecord.savedAt)
    ? rawRecord.savedAt
    : isString(rawRecord.updatedAt)
      ? rawRecord.updatedAt
      : appData.preferences.lastBackupAt ?? "";

  return {
    schemaVersion: CLOUD_BACKUP_SCHEMA_VERSION,
    savedAt,
    appData,
  };
}

function createCloudBackupEnvelope(appData: LocalAppData): CloudBackupEnvelope {
  const savedAt = appData.preferences.lastBackupAt ?? getNow();

  return {
    schemaVersion: CLOUD_BACKUP_SCHEMA_VERSION,
    savedAt,
    appData: normalizeAppData(appData, appData.preferences.language),
  };
}

export function subscribeUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
) {
  return onSnapshot(userDoc(uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...(snapshot.data() as Omit<UserProfile, "id">),
    });
  });
}

export function subscribeClassrooms(
  uid: string,
  callback: (records: ClassroomRecord[]) => void,
) {
  const recordsQuery = query(collection(userDoc(uid), "classes"), orderBy("updatedAt", "desc"));

  return onSnapshot(recordsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<ClassroomRecord, "id">),
      })),
    );
  });
}

export function subscribeStudents(
  uid: string,
  classId: string,
  callback: (records: StudentRecord[]) => void,
) {
  const recordsQuery = query(
    collection(classDoc(uid, classId), "students"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(recordsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<StudentRecord, "id">),
      })),
    );
  });
}

export function subscribeSeatPlans(
  uid: string,
  classId: string,
  callback: (records: SeatPlanRecord[]) => void,
) {
  const recordsQuery = query(
    collection(classDoc(uid, classId), "seatPlans"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(recordsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<SeatPlanRecord, "id">),
      })),
    );
  });
}

export async function upsertUserProfile(input: {
  uid: string;
  displayName: string;
  email: string;
  language: Language;
}) {
  const now = getNow();

  await setDoc(
    userDoc(input.uid),
    sanitizeFirestoreObject({
      displayName: input.displayName,
      email: input.email,
      language: input.language,
      updatedAt: now,
      createdAt: now,
    }),
    { merge: true },
  );
}

export async function updateUserSettings(
  uid: string,
  patch: Partial<Pick<UserProfile, "language" | "recentClassId">>,
) {
  await setDoc(
    userDoc(uid),
    sanitizeFirestoreObject({
      ...patch,
      updatedAt: getNow(),
    }),
    { merge: true },
  );
}

export async function createClassroom(uid: string, draft: ClassDraft) {
  const now = getNow();

  await addDoc(collection(userDoc(uid), "classes"), {
    ...sanitizeFirestoreObject(draft),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateClassroom(uid: string, classId: string, draft: ClassDraft) {
  await updateDoc(
    classDoc(uid, classId),
    sanitizeFirestoreObject({
      ...draft,
      updatedAt: getNow(),
    }),
  );
}

export async function createStudent(uid: string, classId: string, draft: StudentDraft) {
  const now = getNow();

  await addDoc(collection(classDoc(uid, classId), "students"), {
    ...sanitizeFirestoreObject(draft),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateStudent(
  uid: string,
  classId: string,
  studentId: string,
  draft: StudentDraft,
) {
  await updateDoc(
    studentDoc(uid, classId, studentId),
    sanitizeFirestoreObject({
      ...draft,
      updatedAt: getNow(),
    }),
  );
}

export async function deleteStudent(uid: string, classId: string, studentId: string) {
  await deleteDoc(studentDoc(uid, classId, studentId));
}

export async function createSeatPlan(
  uid: string,
  classId: string,
  seatPlan: Omit<SeatPlanRecord, "id" | "createdAt" | "updatedAt">,
) {
  const now = getNow();
  const reference = await addDoc(collection(classDoc(uid, classId), "seatPlans"), {
    ...sanitizeFirestoreObject(seatPlan),
    createdAt: now,
    updatedAt: now,
  });

  await updateDoc(
    classDoc(uid, classId),
    sanitizeFirestoreObject({
      lastViewedSeatPlanId: reference.id,
      updatedAt: now,
    }),
  );

  return reference.id;
}

export async function setLastViewedSeatPlan(
  uid: string,
  classId: string,
  seatPlanId: string,
) {
  await updateDoc(
    classDoc(uid, classId),
    sanitizeFirestoreObject({
      lastViewedSeatPlanId: seatPlanId,
      updatedAt: getNow(),
    }),
  );
}

export async function uploadCloudBackup(uid: string, appData: LocalAppData) {
  const backupRef = doc(userDoc(uid), "backups", "primary");
  const backup = createCloudBackupEnvelope(appData);

  await setDoc(backupRef, sanitizeFirestoreObject(backup));
}

export async function downloadCloudBackup(uid: string, fallbackLanguage: Language) {
  const backupRef = doc(userDoc(uid), "backups", "primary");
  const snapshot = await getDoc(backupRef);

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeCloudBackup(snapshot.data(), fallbackLanguage);
}
