import {
  Gender,
  LayoutTemplate,
  SeatAssignment,
  SeatAssignmentMode,
  SeatPosition,
  StudentRecord,
} from "@/lib/types";

function shuffleArray<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function getSeatCapacity(layout: LayoutTemplate) {
  return layout.rows * layout.pairsPerRow * 2;
}

export function buildSeatPositions(layout: LayoutTemplate): SeatPosition[] {
  const positions: SeatPosition[] = [];

  for (let row = 1; row <= layout.rows; row += 1) {
    for (let pair = 1; pair <= layout.pairsPerRow; pair += 1) {
      positions.push({
        seatId: `r${row}-p${pair}-left`,
        row,
        pair,
        side: "left",
      });
      positions.push({
        seatId: `r${row}-p${pair}-right`,
        row,
        pair,
        side: "right",
      });
    }
  }

  return positions;
}

function sortSeats(seats: SeatAssignment[]) {
  return [...seats].sort((left, right) => {
    if (left.row !== right.row) {
      return left.row - right.row;
    }

    if (left.pair !== right.pair) {
      return left.pair - right.pair;
    }

    return left.side === "left" ? -1 : 1;
  });
}

function toAssignment(position: SeatPosition, student?: StudentRecord): SeatAssignment {
  return {
    ...position,
    studentId: student?.id ?? null,
    studentName: student?.name ?? null,
    gender: student?.gender ?? null,
  };
}

function fillRandomly(
  pairPositions: SeatPosition[][],
  students: StudentRecord[],
): SeatAssignment[] {
  const shuffledStudents = shuffleArray(students);
  const orderedSeats = pairPositions.flat();
  const assignments = orderedSeats.map((seat, index) => toAssignment(seat, shuffledStudents[index]));

  return sortSeats(assignments);
}

function fillMixedPairs(
  pairPositions: SeatPosition[][],
  students: StudentRecord[],
): SeatAssignment[] {
  const maleStudents = shuffleArray(students.filter((student) => student.gender === "male"));
  const femaleStudents = shuffleArray(students.filter((student) => student.gender === "female"));
  const leftover: StudentRecord[] = [];
  const groupedStudents: StudentRecord[][] = pairPositions.map(() => []);

  groupedStudents.forEach((group) => {
    if (maleStudents.length > 0 && femaleStudents.length > 0) {
      group.push(maleStudents.pop() as StudentRecord, femaleStudents.pop() as StudentRecord);
    }
  });

  leftover.push(...maleStudents, ...femaleStudents);

  shuffleArray(leftover).forEach((student) => {
    const target = groupedStudents.find((group) => group.length < 2);

    if (target) {
      target.push(student);
    }
  });

  const assignments: SeatAssignment[] = [];

  pairPositions.forEach((pair, index) => {
    const pairStudents = shuffleArray(groupedStudents[index] ?? []);

    pair.forEach((seat, seatIndex) => {
      assignments.push(toAssignment(seat, pairStudents[seatIndex]));
    });
  });

  return sortSeats(assignments);
}

export function generateSeatAssignments(
  students: StudentRecord[],
  layout: LayoutTemplate,
  mode: SeatAssignmentMode,
): SeatAssignment[] {
  const positions = buildSeatPositions(layout);
  const pairMap = new Map<string, SeatPosition[]>();

  positions.forEach((position) => {
    const key = `r${position.row}-p${position.pair}`;
    const current = pairMap.get(key) ?? [];
    current.push(position);
    pairMap.set(key, current);
  });

  const pairPositions = Array.from(pairMap.values());

  if (mode === "mixed_pairs_preferred") {
    return fillMixedPairs(pairPositions, students);
  }

  return fillRandomly(pairPositions, students);
}

export function drawRandomStudents(
  students: StudentRecord[],
  genderFilter: Gender | "all",
  count: 1 | 2 | 3 | 4 | 5,
) {
  const candidates =
    genderFilter === "all"
      ? students
      : students.filter((student) => student.gender === genderFilter);

  return shuffleArray(candidates).slice(0, count);
}
