"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import styles from "@/components/dashboard-app.module.css";
import { LanguageSwitch, SeatGrid } from "@/components/shared-app-ui";
import { useLanguage } from "@/components/providers";
import { useI18n } from "@/lib/i18n";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { drawRandomStudents, getSeatCapacity } from "@/lib/layout";
import { Language, LocalAppData, PickerDrawCount, PickerGenderFilter, StudentRecord } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";

function formatDate(value?: string, language: Language = "ko") {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
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

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  return new AudioContextClass();
}

export function HomeApp() {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerCompleteRef = useRef<() => void>(() => undefined);
  const [didLoadLocalData, setDidLoadLocalData] = useState(false);
  const [localDataReady, setLocalDataReady] = useState(false);
  const [appData, setAppData] = useState<LocalAppData>(() => getEmptyAppData(language));
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSeatPlanId, setSelectedSeatPlanId] = useState("");
  const [pickerGender, setPickerGender] = useState<PickerGenderFilter>("all");
  const [pickerCount, setPickerCount] = useState<PickerDrawCount>(1);
  const [pickerResult, setPickerResult] = useState<StudentRecord[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
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
  const currentLayout =
    selectedSeatPlan?.layoutTemplate ??
    selectedClass?.layoutTemplate ?? {
      rows: 4,
      pairsPerRow: 3,
    };

  const ensureAudioReady = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume().catch(() => undefined);
    }

    return audioContextRef.current;
  };

  const playTimerCompleteSound = async () => {
    const audioContext = await ensureAudioReady();

    if (!audioContext) {
      return;
    }

    const notes = [783.99, 987.77, 1174.66, 1567.98];
    const baseTime = audioContext.currentTime + 0.05;

    notes.forEach((frequency, index) => {
      const noteStart = baseTime + index * 0.22;
      const noteDuration = 1.4;
      const fadeTime = noteStart + noteDuration;
      const gain = audioContext.createGain();
      const tone = audioContext.createOscillator();
      const shimmer = audioContext.createOscillator();

      tone.type = "triangle";
      tone.frequency.setValueAtTime(frequency, noteStart);

      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(frequency * 2, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.0001, fadeTime);

      tone.connect(gain);
      shimmer.connect(gain);
      gain.connect(audioContext.destination);

      tone.start(noteStart);
      shimmer.start(noteStart);
      tone.stop(fadeTime);
      shimmer.stop(fadeTime);
    });
  };
  timerCompleteRef.current = () => {
    void playTimerCompleteSound();
  };

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
    if (!timerRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          setTimerDone(true);
          timerCompleteRef.current();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timerRunning]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  const clearMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    clearMessages();
    setLanguage(nextLanguage);
  };

  const handleSelectClass = (classId: string) => {
    clearMessages();
    setSelectedClassId(classId);

    setAppData((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        recentClassId: classId,
      },
    }));

    const nextClass = classes.find((item) => item.id === classId);
    const nextSeatPlans = appData.seatPlansByClass[classId] ?? [];
    setSelectedSeatPlanId(nextClass?.lastViewedSeatPlanId ?? nextSeatPlans[0]?.id ?? "");
  };

  const handleSelectSeatPlan = (seatPlanId: string) => {
    if (!selectedClass) {
      return;
    }

    setSelectedSeatPlanId(seatPlanId);
    setAppData((current) => ({
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

  const handleDrawStudents = () => {
    clearMessages();

    const drawn = drawRandomStudents(students, pickerGender, pickerCount);

    if (drawn.length === 0) {
      setPickerResult([]);
      setErrorMessage(t("noMatchingStudents"));
      return;
    }

    if (drawn.length < pickerCount) {
      setPickerResult(drawn);
      setErrorMessage(t("notEnoughStudents"));
      return;
    }

    setPickerResult(drawn);
  };

  const applyTimerMinutes = (nextMinutes: number) => {
    const safeMinutes = Math.max(1, Math.min(99, nextMinutes));
    setTimerMinutes(safeMinutes);
    setRemainingSeconds(safeMinutes * 60);
    setTimerRunning(false);
    setTimerDone(false);
  };

  if (!localDataReady) {
    return null;
  }

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{t("savedToFirebase")}</span>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{t("appTitle")}</h1>
              <span className={styles.versionText}>{APP_VERSION}</span>
            </div>
            <p className={styles.subtitle}>{t("appSubtitle")}</p>
            <div className={styles.heroMetaRow}>
              <p className={styles.heroCompactNote}>{t("localModeCompact")}</p>
              <span className={styles.pill}>{t("localOnlyHint")}</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <LanguageSwitch
              language={language}
              onChange={handleLanguageChange}
              labels={{ language: t("language"), korean: t("korean"), english: t("english") }}
            />
            <Link className={styles.button} href="/manage">
              {t("managePage")}
            </Link>
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
              <h2 className={styles.cardTitle}>{t("seatPlans")}</h2>
              <p className={styles.muted}>
                {selectedClass ? `${selectedClass.name} · ${t("mostRecentFallback")}` : t("noClassSelected")}
              </p>
            </div>
          </div>

          {classes.length > 0 ? (
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <span className={styles.label}>{t("classPanel")}</span>
                <div className={styles.toggleGroup}>
                  {classes.map((classroom) => (
                    <button
                      key={classroom.id}
                      className={clsx(
                        styles.chipButton,
                        selectedClassId === classroom.id && styles.chipButtonActive,
                      )}
                      onClick={() => handleSelectClass(classroom.id)}
                      type="button"
                    >
                      {classroom.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!selectedClass ? (
            <div className={styles.emptyState}>{t("homeManageHint")}</div>
          ) : (
            <div className={styles.mainGrid}>
              {seatPlans.length > 0 ? (
                <div className={styles.field}>
                  <span className={styles.label}>{t("monthHistory")}</span>
                  <div className={styles.toggleGroup}>
                    {seatPlans.map((seatPlan) => (
                      <button
                        key={seatPlan.id}
                        className={clsx(
                          styles.tabButton,
                          selectedSeatPlanId === seatPlan.id && styles.tabButtonActive,
                        )}
                        onClick={() => handleSelectSeatPlan(seatPlan.id)}
                        type="button"
                      >
                        {seatPlan.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>{t("emptySeatPlans")}</div>
              )}

              <div className={styles.layoutPreview}>
                <div className={styles.itemHead}>
                  <div>
                    <h3 className={styles.cardTitle}>{t("seatPreviewTitle")}</h3>
                    <p className={styles.muted}>{t("seatMapLegend")}</p>
                  </div>
                  <div className={styles.statusStack}>
                    <span className={styles.pill}>
                      {t("totalSeats")} {getSeatCapacity(currentLayout)}
                    </span>
                    {selectedSeatPlan ? (
                      <span className={styles.pill}>
                        {selectedSeatPlan.title} · {formatDate(selectedSeatPlan.createdAt, language)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <SeatGrid
                  emptyLabel={t("emptySeat")}
                  seats={selectedSeatPlan?.seats}
                  layout={currentLayout}
                />
              </div>
            </div>
          )}
        </section>

        <section className={clsx(styles.card, styles.cardInner)}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>{t("randomPicker")}</h2>
              <p className={styles.muted}>{selectedClass ? selectedClass.name : t("noClassSelected")}</p>
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.label}>{t("pickerGender")}</span>
              <div className={styles.toggleGroup}>
                {([
                  ["all", t("pickerAll")],
                  ["male", t("male")],
                  ["female", t("female")],
                ] as [PickerGenderFilter, string][]).map(([filter, label]) => (
                  <button
                    key={filter}
                    className={clsx(
                      styles.pickerButton,
                      pickerGender === filter && styles.pickerButtonActive,
                    )}
                    onClick={() => setPickerGender(filter)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t("pickerCount")}</span>
              <div className={styles.toggleGroup}>
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    className={clsx(
                      styles.pickerButton,
                      pickerCount === count && styles.pickerButtonActive,
                    )}
                    onClick={() => setPickerCount(count as PickerDrawCount)}
                    type="button"
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={styles.button}
              disabled={students.length === 0}
              onClick={handleDrawStudents}
              type="button"
            >
              {t("drawNow")}
            </button>

            {pickerResult.length === 0 ? (
              <div className={styles.emptyState}>{t("noPickerResult")}</div>
            ) : (
              <div className={styles.pickerResults}>
                {pickerResult.map((student) => (
                  <div className={styles.pickerResultItem} key={student.id}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{student.name}</span>
                      <span className={styles.studentMeta}>
                        {student.gender === "male" ? t("male") : t("female")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={clsx(styles.card, styles.cardInner)}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>{t("timer")}</h2>
              <p className={styles.muted}>{timerDone ? t("timerDone") : t("ready")}</p>
            </div>
            <span className={styles.pill}>{formatTimer(remainingSeconds)}</span>
          </div>
          <div className={styles.fieldGrid}>
            <div className={clsx(styles.timerValue, timerDone && styles.timerDone)}>
              {formatTimer(remainingSeconds)}
            </div>
            <div className={styles.quickButtons}>
              {[1, 3, 5, 10, 15].map((minute) => (
                <button
                  key={minute}
                  className={clsx(
                    styles.chipButton,
                    timerMinutes === minute && styles.chipButtonActive,
                  )}
                  onClick={() => applyTimerMinutes(minute)}
                  type="button"
                >
                  {minute} {t("minutes")}
                </button>
              ))}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="custom-minutes-home">
                {t("minutes")}
              </label>
              <input
                className={styles.input}
                id="custom-minutes-home"
                min={1}
                onChange={(event) => applyTimerMinutes(Number(event.target.value) || 1)}
                type="number"
                value={timerMinutes}
              />
            </div>
            <div className={styles.inlineActions}>
              <button
                className={styles.button}
                onClick={async () => {
                  await ensureAudioReady();
                  setTimerRunning(true);
                  setTimerDone(false);
                }}
                type="button"
              >
                {t("start")}
              </button>
              <button className={styles.ghostButton} onClick={() => setTimerRunning(false)} type="button">
                {t("pause")}
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => applyTimerMinutes(timerMinutes)}
                type="button"
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
