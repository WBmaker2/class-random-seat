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
import {
  ClassDraft,
  ClassroomRecord,
  Language,
  LocalAppData,
  SeatPlanRecord,
  StudentDraft,
  StudentRecord,
  UserProfile,
} from "@/lib/types";

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
    {
      displayName: input.displayName,
      email: input.email,
      language: input.language,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true },
  );
}

export async function updateUserSettings(
  uid: string,
  patch: Partial<Pick<UserProfile, "language" | "recentClassId">>,
) {
  await setDoc(
    userDoc(uid),
    {
      ...patch,
      updatedAt: getNow(),
    },
    { merge: true },
  );
}

export async function createClassroom(uid: string, draft: ClassDraft) {
  const now = getNow();

  await addDoc(collection(userDoc(uid), "classes"), {
    ...draft,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateClassroom(uid: string, classId: string, draft: ClassDraft) {
  await updateDoc(classDoc(uid, classId), {
    ...draft,
    updatedAt: getNow(),
  });
}

export async function createStudent(uid: string, classId: string, draft: StudentDraft) {
  const now = getNow();

  await addDoc(collection(classDoc(uid, classId), "students"), {
    ...draft,
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
  await updateDoc(studentDoc(uid, classId, studentId), {
    ...draft,
    updatedAt: getNow(),
  });
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
    ...seatPlan,
    createdAt: now,
    updatedAt: now,
  });

  await updateDoc(classDoc(uid, classId), {
    lastViewedSeatPlanId: reference.id,
    updatedAt: now,
  });

  return reference.id;
}

export async function setLastViewedSeatPlan(
  uid: string,
  classId: string,
  seatPlanId: string,
) {
  await updateDoc(classDoc(uid, classId), {
    lastViewedSeatPlanId: seatPlanId,
    updatedAt: getNow(),
  });
}

export async function uploadCloudBackup(uid: string, appData: LocalAppData) {
  const backupRef = doc(userDoc(uid), "backups", "primary");

  await setDoc(backupRef, {
    appData,
    updatedAt: getNow(),
  });
}

export async function downloadCloudBackup(uid: string) {
  const backupRef = doc(userDoc(uid), "backups", "primary");
  const snapshot = await getDoc(backupRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as { appData?: LocalAppData; updatedAt?: string };

  return data;
}
