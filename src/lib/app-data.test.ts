import { describe, expect, it } from "vitest";

import { createEmptyAppData, deriveInitialSelection, normalizeAppData } from "./app-data";
import { ClassroomRecord, SeatPlanRecord, StudentRecord } from "./types";

function createClassroom(overrides: Partial<ClassroomRecord> = {}): ClassroomRecord {
  return {
    id: "class-alpha",
    name: "Alpha",
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
    name: "Alice",
    gender: "female",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createSeatPlan(overrides: Partial<SeatPlanRecord> = {}): SeatPlanRecord {
  return {
    id: "seatplan-alpha",
    title: "Plan A",
    assignmentMode: "random",
    layoutTemplate: {
      rows: 4,
      pairsPerRow: 3,
    },
    seats: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeAppData", () => {
  it("falls back safely when local data is corrupted or partial", () => {
    expect(normalizeAppData(null, "en")).toEqual(createEmptyAppData("en"));

    expect(
      normalizeAppData(
        {
          version: 1,
          classes: [createClassroom()],
          studentsByClass: "broken",
          seatPlansByClass: undefined,
          preferences: {
            language: "jp",
          },
        },
        "ko",
      ),
    ).toEqual({
      version: 1,
      classes: [createClassroom()],
      studentsByClass: {
        "class-alpha": [],
      },
      seatPlansByClass: {
        "class-alpha": [],
      },
      preferences: {
        language: "ko",
        recentClassId: "class-alpha",
      },
    });
  });

  it("migrates unknown versions into the current data shape", () => {
    const normalized = normalizeAppData(
      {
        version: 999,
        classes: [createClassroom()],
        studentsByClass: {
          "class-alpha": [createStudent()],
        },
        seatPlansByClass: {
          "class-alpha": [createSeatPlan()],
        },
        preferences: {
          language: "en",
          recentClassId: "class-alpha",
          lastBackupAt: "2026-01-02T00:00:00.000Z",
        },
      },
      "ko",
    );

    expect(normalized.version).toBe(1);
    expect(normalized.classes).toEqual([createClassroom({ lastViewedSeatPlanId: "seatplan-alpha" })]);
    expect(normalized.studentsByClass["class-alpha"]).toEqual([createStudent()]);
    expect(normalized.seatPlansByClass["class-alpha"]).toEqual([createSeatPlan()]);
    expect(normalized.preferences).toEqual({
      language: "en",
      recentClassId: "class-alpha",
      lastBackupAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("normalizes stale recent and last-viewed selections to valid ids", () => {
    const normalized = normalizeAppData(
      {
        version: 1,
        classes: [
          createClassroom({
            id: "class-alpha",
            name: "Alpha",
            lastViewedSeatPlanId: "missing-seatplan",
          }),
          createClassroom({
            id: "class-beta",
            name: "Beta",
            lastViewedSeatPlanId: "missing-seatplan",
          }),
        ],
        studentsByClass: {},
        seatPlansByClass: {
          "class-alpha": [createSeatPlan({ id: "seatplan-alpha" })],
          "class-beta": [createSeatPlan({ id: "seatplan-beta" })],
        },
        preferences: {
          language: "ko",
          recentClassId: "missing-class",
        },
      },
      "en",
    );

    expect(normalized.preferences.recentClassId).toBe("class-alpha");
    expect(normalized.classes).toEqual([
      createClassroom({
        id: "class-alpha",
        name: "Alpha",
        lastViewedSeatPlanId: "seatplan-alpha",
      }),
      createClassroom({
        id: "class-beta",
        name: "Beta",
        lastViewedSeatPlanId: "seatplan-beta",
      }),
    ]);
    expect(deriveInitialSelection(normalized)).toEqual({
      selectedClassId: "class-alpha",
      selectedSeatPlanId: "seatplan-alpha",
    });
  });
});
