"use client";

import Link from "next/link";
import {
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import styles from "@/components/dashboard-app.module.css";
import { LanguageSwitch, SeatGrid, StatCard } from "@/components/shared-app-ui";
import { useLanguage } from "@/components/providers";
import { downloadCloudBackup, uploadCloudBackup } from "@/lib/firebase/data";
import { getFirebaseAuth, googleProvider, hasFirebaseConfig } from "@/lib/firebase/client";
import { useI18n } from "@/lib/i18n";
import { createLocalId, loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { generateSeatAssignments, getSeatCapacity } from "@/lib/layout";
import {
  ClassDraft,
  ClassroomRecord,
  Gender,
  Language,
  LocalAppData,
  SeatAssignmentMode,
  SeatPlanRecord,
  StudentDraft,
  StudentRecord,
} from "@/lib/types";

const DEFAULT_CLASS_DRAFT: ClassDraft = {
  name: "",
  memo: "",
  layoutTemplate: {
    rows: 4,
    pairsPerRow: 3,
  },
};

const DEFAULT_STUDENT_DRAFT: StudentDraft = {
  name: "",
  gender: "male",
};

function formatDate(value?: string, language: Language = "ko") {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEmptyAppData(language: Language): LocalAppData {
  return {
    version: 1,
    classes: [],
    studentsByClass: {},
    seatPlansByClass: {},
    preferences: {
      language,
    },
  };
}

export function ManageApp() {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();
  const [auth, setAuth] = useState<ReturnType<typeof getFirebaseAuth> | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [didLoadLocalData, setDidLoadLocalData] = useState(false);
  const [localDataReady, setLocalDataReady] = useState(false);
  const [appData, setAppData] = useState<LocalAppData>(() => getEmptyAppData(language));
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSeatPlanId, setSelectedSeatPlanId] = useState("");
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [classDialogMode, setClassDialogMode] = useState<"create" | "edit">("create");
  const [classDraft, setClassDraft] = useState<ClassDraft>(DEFAULT_CLASS_DRAFT);
  const [studentDraft, setStudentDraft] = useState<StudentDraft>(DEFAULT_STUDENT_DRAFT);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [seatPlanTitle, setSeatPlanTitle] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<SeatAssignmentMode>("random");
  const [selectedSwapSeatIds, setSelectedSwapSeatIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const classes = appData.classes;
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );
  const students = useMemo(
    () => (selectedClassId ? appData.studentsByClass[selectedClassId] ?? [] : []),
    [appData.studentsByClass, selectedClassId],
  );
  const seatPlans = useMemo(
    () => (selectedClassId ? appData.seatPlansByClass[selectedClassId] ?? [] : []),
    [appData.seatPlansByClass, selectedClassId],
  );
  const selectedSeatPlan = useMemo(
    () => seatPlans.find((item) => item.id === selectedSeatPlanId) ?? null,
    [seatPlans, selectedSeatPlanId],
  );
  const selectedSwapSeats = useMemo(
    () =>
      selectedSwapSeatIds
        .map((seatId) => selectedSeatPlan?.seats.find((seat) => seat.seatId === seatId) ?? null)
        .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat)),
    [selectedSeatPlan, selectedSwapSeatIds],
  );
  const currentLayout =
    selectedSeatPlan?.layoutTemplate ??
    selectedClass?.layoutTemplate ??
    DEFAULT_CLASS_DRAFT.layoutTemplate;
  const studentGenderCounts = useMemo(
    () => ({
      male: students.filter((student) => student.gender === "male").length,
      female: students.filter((student) => student.gender === "female").length,
    }),
    [students],
  );

  useEffect(() => {
    if (didLoadLocalData) {
      return;
    }

    const loadedData = loadLocalAppData(language);
    const nextClassId = loadedData.preferences.recentClassId ?? loadedData.classes[0]?.id ?? "";

    setAppData(loadedData);
    setSelectedClassId(nextClassId);

    const nextSeatPlans = nextClassId ? loadedData.seatPlansByClass[nextClassId] ?? [] : [];
    const nextClass = loadedData.classes.find((item) => item.id === nextClassId);

    setSelectedSeatPlanId(nextClass?.lastViewedSeatPlanId ?? nextSeatPlans[0]?.id ?? "");

    if (loadedData.preferences.language !== language) {
      setLanguage(loadedData.preferences.language);
    }

    setDidLoadLocalData(true);
    setLocalDataReady(true);
  }, [didLoadLocalData, language, setLanguage]);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setAuthLoading(false);
      return undefined;
    }

    const nextAuth = getFirebaseAuth();

    if (!nextAuth) {
      setAuthLoading(false);
      return undefined;
    }

    setAuth(nextAuth);

    void getRedirectResult(nextAuth)
      .then((result) => {
        if (result?.user) {
          setStatusMessage(t("backupConnected"));
        }
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Sign-in failed.");
      });

    return onAuthStateChanged(nextAuth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
  }, [t]);

  useEffect(() => {
    if (!localDataReady) {
      return;
    }

    saveLocalAppData(appData);
  }, [appData, localDataReady]);

  useEffect(() => {
    if (!localDataReady) {
      return;
    }

    setAppData((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        language,
      },
    }));
  }, [language, localDataReady]);

  useEffect(() => {
    if (selectedSeatPlan) {
      setAssignmentMode(selectedSeatPlan.assignmentMode);
    }

    setSelectedSwapSeatIds([]);
  }, [selectedSeatPlanId, selectedSeatPlan]);

  const clearMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const updateAppData = (updater: (current: LocalAppData) => LocalAppData) => {
    setAppData((current) => updater(current));
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    clearMessages();
    setLanguage(nextLanguage);
  };

  const handleSignIn = async () => {
    if (!auth) {
      return;
    }

    clearMessages();

    try {
      await signInWithPopup(auth, googleProvider);
      setStatusMessage(t("backupConnected"));
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

      if (
        code === "auth/unauthorized-domain" ||
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/network-request-failed"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Sign-in failed.");
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
  };

  const handleBackupToCloud = async () => {
    if (!authUser) {
      setErrorMessage(t("backupReady"));
      return;
    }

    clearMessages();

    try {
      const now = new Date().toISOString();
      const nextData: LocalAppData = {
        ...appData,
        preferences: {
          ...appData.preferences,
          language,
          lastBackupAt: now,
        },
      };

      await uploadCloudBackup(authUser.uid, nextData);
      setAppData(nextData);
      setStatusMessage(t("backupSaved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Backup failed.");
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!authUser) {
      setErrorMessage(t("backupReady"));
      return;
    }

    clearMessages();

    try {
      const backup = await downloadCloudBackup(authUser.uid);

      if (!backup?.appData) {
        setErrorMessage(t("noCloudBackup"));
        return;
      }

      const approved = window.confirm(t("restoreConfirm"));

      if (!approved) {
        return;
      }

      const restoredData: LocalAppData = {
        ...backup.appData,
        preferences: {
          ...backup.appData.preferences,
          lastRestoreAt: new Date().toISOString(),
        },
      };

      setAppData(restoredData);
      setSelectedClassId(restoredData.preferences.recentClassId ?? restoredData.classes[0]?.id ?? "");
      setSelectedSeatPlanId("");

      if (restoredData.preferences.language !== language) {
        setLanguage(restoredData.preferences.language);
      }

      setStatusMessage(t("restoreSaved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Restore failed.");
    }
  };

  const openCreateClassDialog = () => {
    clearMessages();
    setClassDialogMode("create");
    setClassDraft(DEFAULT_CLASS_DRAFT);
    setClassDialogOpen(true);
  };

  const openEditClassDialog = () => {
    if (!selectedClass) {
      return;
    }

    clearMessages();
    setClassDialogMode("edit");
    setClassDraft({
      name: selectedClass.name,
      memo: selectedClass.memo,
      layoutTemplate: selectedClass.layoutTemplate,
    });
    setClassDialogOpen(true);
  };

  const handleSelectClass = (classId: string) => {
    clearMessages();
    setSelectedClassId(classId);
    updateAppData((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        recentClassId: classId,
      },
    }));

    const nextClass = classes.find((item) => item.id === classId);
    const nextSeatPlans = appData.seatPlansByClass[classId] ?? [];
    setSelectedSeatPlanId(nextClass?.lastViewedSeatPlanId ?? nextSeatPlans[0]?.id ?? "");
    setSelectedSwapSeatIds([]);
  };

  const handleSelectSeatPlan = (seatPlanId: string) => {
    if (!selectedClass) {
      return;
    }

    setSelectedSeatPlanId(seatPlanId);
    setSelectedSwapSeatIds([]);
    updateAppData((current) => ({
      ...current,
      classes: current.classes.map((item) =>
        item.id === selectedClass.id
          ? {
              ...item,
              lastViewedSeatPlanId: seatPlanId,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
  };

  const updateSelectedSeatPlan = (
    updater: (seatPlan: SeatPlanRecord) => SeatPlanRecord,
    successMessage: string,
  ) => {
    if (!selectedClass || !selectedSeatPlan) {
      return;
    }

    const now = new Date().toISOString();

    updateAppData((current) => ({
      ...current,
      seatPlansByClass: {
        ...current.seatPlansByClass,
        [selectedClass.id]: (current.seatPlansByClass[selectedClass.id] ?? []).map((seatPlan) =>
          seatPlan.id === selectedSeatPlan.id ? updater({ ...seatPlan, updatedAt: now }) : seatPlan,
        ),
      },
      classes: current.classes.map((item) =>
        item.id === selectedClass.id
          ? {
              ...item,
              lastViewedSeatPlanId: selectedSeatPlan.id,
              updatedAt: now,
            }
          : item,
      ),
    }));

    setStatusMessage(successMessage);
  };

  const handleSaveClass = () => {
    clearMessages();

    if (!classDraft.name.trim()) {
      setErrorMessage(t("className"));
      return;
    }

    const now = new Date().toISOString();

    if (classDialogMode === "create") {
      const classId = createLocalId("class");
      const nextClass: ClassroomRecord = {
        id: classId,
        name: classDraft.name.trim(),
        memo: classDraft.memo.trim(),
        layoutTemplate: classDraft.layoutTemplate,
        createdAt: now,
        updatedAt: now,
      };

      updateAppData((current) => ({
        ...current,
        classes: [nextClass, ...current.classes],
        studentsByClass: {
          ...current.studentsByClass,
          [classId]: [],
        },
        seatPlansByClass: {
          ...current.seatPlansByClass,
          [classId]: [],
        },
        preferences: {
          ...current.preferences,
          recentClassId: classId,
        },
      }));
      setSelectedClassId(classId);
    } else if (selectedClass) {
      updateAppData((current) => ({
        ...current,
        classes: current.classes.map((item) =>
          item.id === selectedClass.id
            ? {
                ...item,
                name: classDraft.name.trim(),
                memo: classDraft.memo.trim(),
                layoutTemplate: classDraft.layoutTemplate,
                updatedAt: now,
              }
            : item,
        ),
      }));
    }

    setClassDialogOpen(false);
    setStatusMessage(t("saveSuccessful"));
  };

  const handleStudentSubmit = () => {
    if (!selectedClass) {
      return;
    }

    clearMessages();

    if (!studentDraft.name.trim()) {
      setErrorMessage(t("studentName"));
      return;
    }

    const now = new Date().toISOString();

    updateAppData((current) => {
      const currentStudents = current.studentsByClass[selectedClass.id] ?? [];

      const nextStudents = editingStudentId
        ? currentStudents.map((student) =>
            student.id === editingStudentId
              ? {
                  ...student,
                  name: studentDraft.name.trim(),
                  gender: studentDraft.gender,
                  updatedAt: now,
                }
              : student,
          )
        : [
            ...currentStudents,
            {
              id: createLocalId("student"),
              name: studentDraft.name.trim(),
              gender: studentDraft.gender,
              createdAt: now,
              updatedAt: now,
            },
          ];

      return {
        ...current,
        studentsByClass: {
          ...current.studentsByClass,
          [selectedClass.id]: nextStudents,
        },
      };
    });

    setStudentDraft(DEFAULT_STUDENT_DRAFT);
    setEditingStudentId(null);
    setStatusMessage(t("saveSuccessful"));
  };

  const handleEditStudent = (student: StudentRecord) => {
    clearMessages();
    setEditingStudentId(student.id);
    setStudentDraft({
      name: student.name,
      gender: student.gender,
    });
  };

  const handleDeleteStudent = (student: StudentRecord) => {
    if (!selectedClass) {
      return;
    }

    const approved = window.confirm(`${student.name} ${t("delete")} ?`);

    if (!approved) {
      return;
    }

    updateAppData((current) => ({
      ...current,
      studentsByClass: {
        ...current.studentsByClass,
        [selectedClass.id]: (current.studentsByClass[selectedClass.id] ?? []).filter(
          (item) => item.id !== student.id,
        ),
      },
    }));

    if (editingStudentId === student.id) {
      setStudentDraft(DEFAULT_STUDENT_DRAFT);
      setEditingStudentId(null);
    }
  };

  const handleCreateSeatPlan = () => {
    if (!selectedClass) {
      return;
    }

    clearMessages();

    if (!seatPlanTitle.trim()) {
      setErrorMessage(t("seatPlanTitle"));
      return;
    }

    if (students.length > getSeatCapacity(selectedClass.layoutTemplate)) {
      setErrorMessage(t("seatCapacityError"));
      return;
    }

    const now = new Date().toISOString();
    const seatPlanId = createLocalId("seatplan");
    const nextSeatPlan: SeatPlanRecord = {
      id: seatPlanId,
      title: seatPlanTitle.trim(),
      assignmentMode,
      layoutTemplate: selectedClass.layoutTemplate,
      seats: generateSeatAssignments(students, selectedClass.layoutTemplate, assignmentMode),
      createdAt: now,
      updatedAt: now,
    };

    updateAppData((current) => ({
      ...current,
      seatPlansByClass: {
        ...current.seatPlansByClass,
        [selectedClass.id]: [nextSeatPlan, ...(current.seatPlansByClass[selectedClass.id] ?? [])],
      },
      classes: current.classes.map((item) =>
        item.id === selectedClass.id
          ? {
              ...item,
              lastViewedSeatPlanId: seatPlanId,
              updatedAt: now,
            }
          : item,
      ),
    }));

    setSelectedSeatPlanId(seatPlanId);
    setSeatPlanTitle("");
    setStatusMessage(t("saveSuccessful"));
  };

  const handleRerandomizeSeatPlan = () => {
    if (!selectedClass || !selectedSeatPlan) {
      return;
    }

    clearMessages();

    const layoutTemplate = selectedSeatPlan.layoutTemplate;

    if (students.length > getSeatCapacity(layoutTemplate)) {
      setErrorMessage(t("seatCapacityError"));
      return;
    }

    updateSelectedSeatPlan(
      (seatPlan) => ({
        ...seatPlan,
        assignmentMode,
        seats: generateSeatAssignments(students, layoutTemplate, assignmentMode),
      }),
      t("seatPlanUpdated"),
    );
    setSelectedSwapSeatIds([]);
  };

  const handleToggleSeatSelection = (seatId: string) => {
    if (!selectedSeatPlan) {
      return;
    }

    setSelectedSwapSeatIds((current) => {
      if (current.includes(seatId)) {
        return current.filter((item) => item !== seatId);
      }

      if (current.length === 2) {
        return [seatId];
      }

      return [...current, seatId];
    });
  };

  const handleSwapSelectedSeats = () => {
    if (!selectedSeatPlan || selectedSwapSeatIds.length !== 2) {
      setErrorMessage(t("swapSelectionError"));
      return;
    }

    clearMessages();

    const [firstSeatId, secondSeatId] = selectedSwapSeatIds;
    const firstSeat = selectedSeatPlan.seats.find((seat) => seat.seatId === firstSeatId);
    const secondSeat = selectedSeatPlan.seats.find((seat) => seat.seatId === secondSeatId);

    if (!firstSeat || !secondSeat) {
      setErrorMessage(t("swapSelectionError"));
      return;
    }

    updateSelectedSeatPlan(
      (seatPlan) => ({
        ...seatPlan,
        seats: seatPlan.seats.map((seat) => {
          if (seat.seatId === firstSeatId) {
            return {
              ...seat,
              studentId: secondSeat.studentId,
              studentName: secondSeat.studentName,
              gender: secondSeat.gender,
            };
          }

          if (seat.seatId === secondSeatId) {
            return {
              ...seat,
              studentId: firstSeat.studentId,
              studentName: firstSeat.studentName,
              gender: firstSeat.gender,
            };
          }

          return seat;
        }),
      }),
      t("swapCompleted"),
    );
    setSelectedSwapSeatIds([]);
  };

  if (!localDataReady) {
    return null;
  }

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{t("teacherTools")}</span>
            <h1 className={styles.title}>{t("managePageTitle")}</h1>
            <p className={styles.subtitle}>{t("managePageBody")}</p>
            <div className={styles.heroMetaRow}>
              <p className={styles.heroCompactNote}>{t("manageIntroCompact")}</p>
              <span className={styles.pill}>{t("optionalBackup")}</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <LanguageSwitch
              language={language}
              onChange={handleLanguageChange}
              labels={{ language: t("language"), korean: t("korean"), english: t("english") }}
            />
            <Link className={styles.ghostButton} href="/">
              {t("backHome")}
            </Link>
            {hasFirebaseConfig ? (
              authUser ? (
                <button className={styles.button} onClick={handleSignOut} type="button">
                  {t("signOut")}
                </button>
              ) : (
                <button className={styles.button} disabled={authLoading} onClick={handleSignIn} type="button">
                  {t("signIn")}
                </button>
              )
            ) : null}
          </div>
        </section>

        <div className={styles.statusStack}>
          {statusMessage ? (
            <div className={clsx(styles.status, styles.statusSuccess)}>{statusMessage}</div>
          ) : null}
          {errorMessage ? (
            <div className={clsx(styles.status, styles.statusError)}>{errorMessage}</div>
          ) : null}
        </div>

        <section className={clsx(styles.card, styles.cardInner)}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>{t("cloudBackupTitle")}</h2>
              <p className={styles.muted}>{t("cloudBackupBody")}</p>
            </div>
          </div>
          <div className={styles.fieldGrid}>
            {hasFirebaseConfig ? (
              authUser ? (
                <div className={styles.inlineActions}>
                  <button className={styles.button} onClick={() => void handleBackupToCloud()} type="button">
                    {t("backupNow")}
                  </button>
                  <button className={styles.ghostButton} onClick={() => void handleRestoreFromCloud()} type="button">
                    {t("restoreFromCloud")}
                  </button>
                </div>
              ) : (
                <div className={styles.inlineActions}>
                  <p className={styles.helper}>{t("backupReady")}</p>
                  <button className={styles.button} onClick={handleSignIn} type="button">
                    {t("signIn")}
                  </button>
                </div>
              )
            ) : (
              <div className={styles.emptyState}>{t("backupUnavailable")}</div>
            )}
            <div className={styles.gridStats}>
              <StatCard
                label={t("lastBackupAt")}
                value={appData.preferences.lastBackupAt ? formatDate(appData.preferences.lastBackupAt, language) : "-"}
              />
              <StatCard
                label={t("lastRestoreAt")}
                value={appData.preferences.lastRestoreAt ? formatDate(appData.preferences.lastRestoreAt, language) : "-"}
              />
              <StatCard label={t("classPanel")} value={`${classes.length}`} />
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <section className={clsx(styles.card, styles.cardInner)}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t("classPanel")}</h2>
                  <p className={styles.muted}>{t("manageClassHint")}</p>
                </div>
                <button className={styles.button} onClick={openCreateClassDialog} type="button">
                  {t("createClass")}
                </button>
              </div>
              {classes.length === 0 ? <div className={styles.emptyState}>{t("emptyClasses")}</div> : null}
              <div className={styles.list}>
                {classes.map((classroom) => (
                  <button
                    key={classroom.id}
                    className={clsx(
                      styles.planItem,
                      selectedClassId === classroom.id && styles.planItemActive,
                    )}
                    onClick={() => handleSelectClass(classroom.id)}
                    type="button"
                  >
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{classroom.name}</span>
                      <span className={styles.pill}>{getSeatCapacity(classroom.layoutTemplate)}</span>
                    </div>
                    <div className={styles.itemMeta}>
                      {classroom.layoutTemplate.rows} {t("rows")} /{" "}
                      {classroom.layoutTemplate.pairsPerRow} {t("pairsPerRow")}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className={clsx(styles.card, styles.cardInner)}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t("students")}</h2>
                  <p className={styles.muted}>{selectedClass ? selectedClass.name : t("noClassSelected")}</p>
                </div>
              </div>
              {!selectedClass ? (
                <div className={styles.emptyState}>{t("noClassSelected")}</div>
              ) : (
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="student-name-manage">
                        {t("studentName")}
                      </label>
                      <input
                        className={styles.input}
                        id="student-name-manage"
                        onChange={(event) =>
                          setStudentDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        value={studentDraft.name}
                      />
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>{t("gender")}</span>
                      <div className={styles.toggleGroup}>
                        {(["male", "female"] as Gender[]).map((gender) => (
                          <button
                            key={gender}
                            className={clsx(
                              styles.chipButton,
                              studentDraft.gender === gender && styles.chipButtonActive,
                            )}
                            onClick={() => setStudentDraft((current) => ({ ...current, gender }))}
                            type="button"
                          >
                            {gender === "male" ? t("male") : t("female")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.inlineActions}>
                    <button className={styles.button} onClick={handleStudentSubmit} type="button">
                      {editingStudentId ? t("editStudent") : t("addStudent")}
                    </button>
                    {editingStudentId ? (
                      <button
                        className={styles.ghostButton}
                        onClick={() => {
                          setEditingStudentId(null);
                          setStudentDraft(DEFAULT_STUDENT_DRAFT);
                        }}
                        type="button"
                      >
                        {t("cancel")}
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.gridStats}>
                    <StatCard label={t("students")} value={students.length.toString()} />
                    <StatCard label={t("male")} value={studentGenderCounts.male.toString()} />
                    <StatCard label={t("female")} value={studentGenderCounts.female.toString()} />
                  </div>
                  {students.length === 0 ? (
                    <div className={styles.emptyState}>{t("emptyStudents")}</div>
                  ) : (
                    <div className={styles.list}>
                      {students.map((student) => (
                        <div className={styles.studentItem} key={student.id}>
                          <div className={styles.itemHead}>
                            <span className={styles.itemTitle}>{student.name}</span>
                            <div className={styles.studentMeta}>
                              <span
                                className={clsx(
                                  styles.genderDot,
                                  student.gender === "male"
                                    ? styles.genderDotMale
                                    : styles.genderDotFemale,
                                )}
                              />
                              {student.gender === "male" ? t("male") : t("female")}
                            </div>
                          </div>
                          <div className={styles.studentActions}>
                            <button className={styles.ghostButton} onClick={() => handleEditStudent(student)} type="button">
                              {t("editStudent")}
                            </button>
                            <button className={styles.ghostButton} onClick={() => handleDeleteStudent(student)} type="button">
                              {t("delete")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </aside>

          <section className={styles.main}>
            <section className={clsx(styles.card, styles.cardInner)}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t("seatPlans")}</h2>
                  <p className={styles.muted}>{selectedClass ? selectedClass.name : t("noClassSelected")}</p>
                </div>
                {selectedClass ? (
                  <button className={styles.ghostButton} onClick={openEditClassDialog} type="button">
                    {t("updateLayout")}
                  </button>
                ) : null}
              </div>

              {!selectedClass ? (
                <div className={styles.emptyState}>{t("noClassSelected")}</div>
              ) : (
                <div className={styles.mainGrid}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="seat-plan-title-manage">
                        {t("seatPlanTitle")}
                      </label>
                      <input
                        className={styles.input}
                        id="seat-plan-title-manage"
                        onChange={(event) => setSeatPlanTitle(event.target.value)}
                        placeholder={t("seatPlanHint")}
                        value={seatPlanTitle}
                      />
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>{t("assignmentMode")}</span>
                      <div className={styles.toggleGroup}>
                        {([
                          ["random", t("assignmentRandom")],
                          ["mixed_pairs_preferred", t("assignmentMixed")],
                        ] as [SeatAssignmentMode, string][]).map(([mode, label]) => (
                          <button
                            key={mode}
                            className={clsx(
                              styles.tabButton,
                              assignmentMode === mode && styles.tabButtonActive,
                            )}
                            onClick={() => setAssignmentMode(mode)}
                            type="button"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.inlineActions}>
                    <button className={styles.button} disabled={students.length === 0} onClick={handleCreateSeatPlan} type="button">
                      {t("createSeatPlan")}
                    </button>
                    <button
                      className={styles.ghostButton}
                      disabled={!selectedSeatPlan || students.length === 0}
                      onClick={handleRerandomizeSeatPlan}
                      type="button"
                    >
                      {t("rerandomizeSeatPlan")}
                    </button>
                    <button
                      className={styles.ghostButton}
                      disabled={selectedSwapSeatIds.length !== 2}
                      onClick={handleSwapSelectedSeats}
                      type="button"
                    >
                      {t("swapSelectedSeats")}
                    </button>
                    {selectedSwapSeatIds.length > 0 ? (
                      <button
                        className={styles.ghostButton}
                        onClick={() => setSelectedSwapSeatIds([])}
                        type="button"
                      >
                        {t("clearSelection")}
                      </button>
                    ) : null}
                    <span className={styles.pill}>
                      {t("totalSeats")} {getSeatCapacity(currentLayout)}
                    </span>
                  </div>

                  {seatPlans.length === 0 ? (
                    <div className={styles.emptyState}>{t("emptySeatPlans")}</div>
                  ) : (
                    <div className={styles.list}>
                      {seatPlans.map((seatPlan) => (
                        <button
                          key={seatPlan.id}
                          className={clsx(
                            styles.planItem,
                            selectedSeatPlanId === seatPlan.id && styles.planItemActive,
                          )}
                          onClick={() => handleSelectSeatPlan(seatPlan.id)}
                          type="button"
                        >
                          <div className={styles.itemHead}>
                            <span className={styles.itemTitle}>{seatPlan.title}</span>
                            <span className={styles.pill}>
                              {seatPlan.assignmentMode === "mixed_pairs_preferred"
                                ? t("assignmentMixed")
                                : t("assignmentRandom")}
                            </span>
                          </div>
                          <div className={styles.itemMeta}>
                            {t("generatedAt")} {formatDate(seatPlan.createdAt, language)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.layoutPreview}>
                    <div className={styles.itemHead}>
                      <div>
                        <h3 className={styles.cardTitle}>{t("seatPreviewTitle")}</h3>
                        <p className={styles.muted}>{t("seatMapLegend")}</p>
                      </div>
                    </div>
                    {selectedSeatPlan ? (
                      <div className={styles.selectionStrip}>
                        <p className={styles.helper}>{t("swapHint")}</p>
                        {selectedSwapSeats.length > 0 ? (
                          <div className={styles.selectionChips}>
                            <span className={styles.pill}>{t("selectedStudents")}</span>
                            {selectedSwapSeats.map((seat) => (
                              <span className={styles.pill} key={seat.seatId}>
                                {seat.studentName ?? `${t("emptySeat")} ${seat.row}-${seat.pair} ${seat.side === "left" ? "L" : "R"}`}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <SeatGrid
                      emptyLabel={t("emptySeat")}
                      onSeatClick={selectedSeatPlan ? handleToggleSeatSelection : undefined}
                      selectedSeatIds={selectedSwapSeatIds}
                      seats={selectedSeatPlan?.seats}
                      layout={currentLayout}
                    />
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>

      {classDialogOpen ? (
        <div className={styles.dialogBackdrop}>
          <div className={styles.dialog}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  {classDialogMode === "create" ? t("createClass") : t("editClass")}
                </h2>
                <p className={styles.muted}>{t("layoutSettings")}</p>
              </div>
              <button className={styles.ghostButton} onClick={() => setClassDialogOpen(false)} type="button">
                {t("cancel")}
              </button>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="class-name-manage">
                  {t("className")}
                </label>
                <input
                  className={styles.input}
                  id="class-name-manage"
                  onChange={(event) =>
                    setClassDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  value={classDraft.name}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="class-memo-manage">
                  {t("classMemo")}
                </label>
                <textarea
                  className={styles.textarea}
                  id="class-memo-manage"
                  onChange={(event) =>
                    setClassDraft((current) => ({ ...current, memo: event.target.value }))
                  }
                  value={classDraft.memo}
                />
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <span className={styles.label}>{t("rows")}</span>
                  <div className={styles.toggleGroup}>
                    {[1, 2, 3, 4, 5].map((rowCount) => (
                      <button
                        key={rowCount}
                        className={clsx(
                          styles.chipButton,
                          classDraft.layoutTemplate.rows === rowCount && styles.chipButtonActive,
                        )}
                        onClick={() =>
                          setClassDraft((current) => ({
                            ...current,
                            layoutTemplate: { ...current.layoutTemplate, rows: rowCount },
                          }))
                        }
                        type="button"
                      >
                        {rowCount}
                      </button>
                    ))}
                  </div>
                  <p className={styles.helper}>{t("rowsHelper")}</p>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>{t("pairsPerRow")}</span>
                  <div className={styles.toggleGroup}>
                    {[1, 2, 3].map((pairs) => (
                      <button
                        key={pairs}
                        className={clsx(
                          styles.chipButton,
                          classDraft.layoutTemplate.pairsPerRow === pairs &&
                            styles.chipButtonActive,
                        )}
                        onClick={() =>
                          setClassDraft((current) => ({
                            ...current,
                            layoutTemplate: { ...current.layoutTemplate, pairsPerRow: pairs },
                          }))
                        }
                        type="button"
                      >
                        {pairs}
                      </button>
                    ))}
                  </div>
                  <p className={styles.helper}>{t("pairsHelper")}</p>
                </div>
              </div>

              <div className={styles.gridStats}>
                <StatCard label={t("rows")} value={`${classDraft.layoutTemplate.rows}`} />
                <StatCard
                  label={t("pairsPerRow")}
                  value={`${classDraft.layoutTemplate.pairsPerRow}`}
                />
                <StatCard
                  label={t("totalSeats")}
                  value={`${getSeatCapacity(classDraft.layoutTemplate)}`}
                />
              </div>

              <div className={styles.layoutPreview}>
                <div className={styles.itemHead}>
                  <div>
                    <h3 className={styles.cardTitle}>{t("livePreview")}</h3>
                    <p className={styles.muted}>{t("seatMapLegend")}</p>
                  </div>
                </div>
                <SeatGrid emptyLabel={t("emptySeat")} layout={classDraft.layoutTemplate} />
              </div>

              <div className={styles.inlineActions}>
                <button className={styles.button} onClick={handleSaveClass} type="button">
                  {t("save")}
                </button>
                <button className={styles.ghostButton} onClick={() => setClassDialogOpen(false)} type="button">
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
