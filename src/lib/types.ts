export type Language = "ko" | "en";
export type Gender = "male" | "female";
export type SeatAssignmentMode = "random" | "mixed_pairs_preferred";
export type PickerGenderFilter = "all" | Gender;
export type PickerDrawCount = 1 | 2 | 3 | 4 | 5;

export interface LayoutTemplate {
  rows: number;
  pairsPerRow: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  language: Language;
  recentClassId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomRecord {
  id: string;
  name: string;
  memo: string;
  layoutTemplate: LayoutTemplate;
  lastViewedSeatPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  gender: Gender;
  createdAt: string;
  updatedAt: string;
}

export interface SeatPosition {
  seatId: string;
  row: number;
  pair: number;
  side: "left" | "right";
}

export interface SeatAssignment extends SeatPosition {
  studentId: string | null;
  studentName: string | null;
  gender: Gender | null;
}

export interface SeatPlanRecord {
  id: string;
  title: string;
  assignmentMode: SeatAssignmentMode;
  layoutTemplate: LayoutTemplate;
  seats: SeatAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassDraft {
  name: string;
  memo: string;
  layoutTemplate: LayoutTemplate;
}

export interface StudentDraft {
  name: string;
  gender: Gender;
}

export interface AppPreferences {
  language: Language;
  recentClassId?: string;
  lastBackupAt?: string;
  lastRestoreAt?: string;
}

export interface LocalAppData {
  version: number;
  classes: ClassroomRecord[];
  studentsByClass: Record<string, StudentRecord[]>;
  seatPlansByClass: Record<string, SeatPlanRecord[]>;
  preferences: AppPreferences;
}
