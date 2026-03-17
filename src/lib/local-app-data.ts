import { Language, LocalAppData } from "@/lib/types";

export const LOCAL_APP_DATA_KEY = "class-random-seat-app-data";

const CURRENT_VERSION = 1;

function createEmptyData(language: Language): LocalAppData {
  return {
    version: CURRENT_VERSION,
    classes: [],
    studentsByClass: {},
    seatPlansByClass: {},
    preferences: {
      language,
    },
  };
}

export function loadLocalAppData(language: Language) {
  if (typeof window === "undefined") {
    return createEmptyData(language);
  }

  const rawValue = window.localStorage.getItem(LOCAL_APP_DATA_KEY);

  if (!rawValue) {
    return createEmptyData(language);
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<LocalAppData>;

    return {
      version: CURRENT_VERSION,
      classes: Array.isArray(parsedValue.classes) ? parsedValue.classes : [],
      studentsByClass: parsedValue.studentsByClass ?? {},
      seatPlansByClass: parsedValue.seatPlansByClass ?? {},
      preferences: {
        language:
          parsedValue.preferences?.language === "en" || parsedValue.preferences?.language === "ko"
            ? parsedValue.preferences.language
            : language,
        recentClassId: parsedValue.preferences?.recentClassId,
        lastBackupAt: parsedValue.preferences?.lastBackupAt,
        lastRestoreAt: parsedValue.preferences?.lastRestoreAt,
      },
    };
  } catch {
    return createEmptyData(language);
  }
}

export function saveLocalAppData(data: LocalAppData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_APP_DATA_KEY, JSON.stringify(data));
}

export function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
