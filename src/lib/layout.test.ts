import { describe, expect, it } from "vitest";

import { buildSeatPositions, generateSeatAssignments, getSeatCapacity } from "./layout";
import { LayoutTemplate, StudentRecord } from "./types";

function createLayout(overrides: Partial<LayoutTemplate> = {}): LayoutTemplate {
  return {
    rows: 4,
    pairsPerRow: 3,
    ...overrides,
  };
}

function createStudent(index: number, gender: StudentRecord["gender"]): StudentRecord {
  return {
    id: `student-${index}`,
    name: `Student ${index}`,
    gender,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("layout", () => {
  it("calculates seat capacity from rows and desk pairs", () => {
    expect(getSeatCapacity(createLayout())).toBe(24);
    expect(getSeatCapacity(createLayout({ rows: 2, pairsPerRow: 5 }))).toBe(20);
  });

  it("builds one left and one right seat for every desk pair", () => {
    const positions = buildSeatPositions(createLayout({ rows: 2, pairsPerRow: 2 }));

    expect(positions).toHaveLength(8);
    expect(positions[0]).toEqual({
      seatId: "r1-p1-left",
      row: 1,
      pair: 1,
      side: "left",
    });
    expect(positions[1]).toEqual({
      seatId: "r1-p1-right",
      row: 1,
      pair: 1,
      side: "right",
    });
    expect(positions.at(-1)).toEqual({
      seatId: "r2-p2-right",
      row: 2,
      pair: 2,
      side: "right",
    });
  });

  it("generates one assignment per seat and only fills the available student count", () => {
    const layout = createLayout({ rows: 2, pairsPerRow: 2 });
    const students = [
      createStudent(1, "female"),
      createStudent(2, "male"),
      createStudent(3, "female"),
      createStudent(4, "male"),
      createStudent(5, "female"),
    ];

    const assignments = generateSeatAssignments(students, layout, "random");

    expect(assignments).toHaveLength(getSeatCapacity(layout));
    expect(assignments.filter((seat) => seat.studentId !== null)).toHaveLength(students.length);
    expect(assignments.filter((seat) => seat.studentId === null)).toHaveLength(3);
  });

  it("never assigns more students than the layout capacity in mixed-pair mode", () => {
    const layout = createLayout({ rows: 2, pairsPerRow: 3 });
    const students = [
      createStudent(1, "male"),
      createStudent(2, "female"),
      createStudent(3, "male"),
      createStudent(4, "female"),
      createStudent(5, "male"),
      createStudent(6, "female"),
      createStudent(7, "male"),
      createStudent(8, "female"),
      createStudent(9, "male"),
      createStudent(10, "female"),
      createStudent(11, "male"),
      createStudent(12, "female"),
      createStudent(13, "male"),
      createStudent(14, "female"),
    ];

    const assignments = generateSeatAssignments(students, layout, "mixed_pairs_preferred");
    const assignedSeatIds = assignments
      .filter((seat) => seat.studentId !== null)
      .map((seat) => seat.studentId);

    expect(assignments).toHaveLength(getSeatCapacity(layout));
    expect(assignedSeatIds).toHaveLength(getSeatCapacity(layout));
    expect(new Set(assignedSeatIds).size).toBe(getSeatCapacity(layout));
  });
});
