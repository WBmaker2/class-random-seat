import { CloudBackupEnvelope, LocalAppData } from "@/lib/types";

export function buildRestoredAppData(backup: CloudBackupEnvelope): LocalAppData {
  return {
    ...backup.appData,
    preferences: {
      ...backup.appData.preferences,
      lastRestoreAt: new Date().toISOString(),
    },
  };
}

export function removeStudentFromClass(
  current: LocalAppData,
  classId: string,
  studentId: string,
): LocalAppData {
  return {
    ...current,
    studentsByClass: {
      ...current.studentsByClass,
      [classId]: (current.studentsByClass[classId] ?? []).filter((item) => item.id !== studentId),
    },
  };
}

export function resolveDialogFocusTarget(
  trigger: HTMLElement | null,
  fallback?: HTMLElement | null,
) {
  if (trigger?.isConnected) {
    return trigger;
  }

  if (fallback?.isConnected) {
    return fallback;
  }

  return null;
}
