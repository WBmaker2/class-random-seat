import { createEmptyAppData, normalizeAppData } from "./app-data";
import { Language, LocalAppData } from "./types";

export const LOCAL_APP_DATA_KEY = "class-random-seat-app-data";

export function loadLocalAppData(language: Language) {
  if (typeof window === "undefined") {
    return createEmptyAppData(language);
  }

  const rawValue = window.localStorage.getItem(LOCAL_APP_DATA_KEY);

  if (!rawValue) {
    return createEmptyAppData(language);
  }

  try {
    return normalizeAppData(JSON.parse(rawValue), language);
  } catch {
    return createEmptyAppData(language);
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
