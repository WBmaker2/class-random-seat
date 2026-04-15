import { afterEach, describe, expect, it, vi } from "vitest";

import { createEmptyAppData } from "@/lib/app-data";
import { CloudBackupEnvelope, ClassroomRecord, StudentRecord } from "@/lib/types";

import {
  buildRestoredAppData,
  removeStudentFromClass,
  resolveDialogFocusTarget,
} from "./manage-app-actions";

function createClassroom(overrides: Partial<ClassroomRecord> = {}): ClassroomRecord {
  return {
    id: "class-alpha",
    name: "Class Alpha",
    memo: "",
    layoutTemplate: {
      rows: 4,
      pairsPerRow: 3,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createStudent(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    id: "student-alpha",
    name: "Kim",
    gender: "male",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("manage-app-actions", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a fresh restore timestamp when applying a cloud backup", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:30:00.000Z"));

    const backup: CloudBackupEnvelope = {
      schemaVersion: 1,
      savedAt: "2026-04-15T12:00:00.000Z",
      appData: {
        ...createEmptyAppData("ko"),
        classes: [createClassroom({ id: "class-restore", name: "Restored Class" })],
        studentsByClass: {
          "class-restore": [createStudent({ id: "student-restore", name: "Lee" })],
        },
        seatPlansByClass: {
          "class-restore": [],
        },
        preferences: {
          language: "ko",
          recentClassId: "class-restore",
        },
      },
    };

    expect(buildRestoredAppData(backup)).toEqual({
      ...backup.appData,
      preferences: {
        ...backup.appData.preferences,
        lastRestoreAt: "2026-04-15T12:30:00.000Z",
      },
    });
  });

  it("removes a student only from the confirmed class", () => {
    const appData = {
      ...createEmptyAppData("en"),
      classes: [
        createClassroom({ id: "class-alpha", name: "Alpha" }),
        createClassroom({ id: "class-beta", name: "Beta" }),
      ],
      studentsByClass: {
        "class-alpha": [
          createStudent({ id: "student-alpha", name: "Kim" }),
          createStudent({ id: "student-other", name: "Park" }),
        ],
        "class-beta": [createStudent({ id: "student-beta", name: "Lee" })],
      },
      seatPlansByClass: {
        "class-alpha": [],
        "class-beta": [],
      },
      preferences: {
        language: "en" as const,
        recentClassId: "class-alpha",
      },
    };

    expect(removeStudentFromClass(appData, "class-alpha", "student-alpha")).toEqual({
      ...appData,
      studentsByClass: {
        "class-alpha": [createStudent({ id: "student-other", name: "Park" })],
        "class-beta": [createStudent({ id: "student-beta", name: "Lee" })],
      },
    });
  });

  it("falls back to a safe focus target when the original trigger was removed", () => {
    const trigger = { isConnected: false } as HTMLElement;
    const fallback = { isConnected: true } as HTMLElement;

    expect(resolveDialogFocusTarget(trigger, fallback)).toBe(fallback);
  });
});
