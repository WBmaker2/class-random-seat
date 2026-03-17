"use client";

import clsx from "clsx";
import styles from "@/components/dashboard-app.module.css";
import { buildSeatPositions } from "@/lib/layout";
import { Language, SeatPlanRecord } from "@/lib/types";

export function LanguageSwitch({
  language,
  onChange,
  labels,
}: {
  language: Language;
  onChange: (language: Language) => void;
  labels: { language: string; korean: string; english: string };
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        <div className={styles.field}>
          <span className={styles.label}>{labels.language}</span>
          <div className={styles.toggleGroup}>
            {([
              ["ko", labels.korean],
              ["en", labels.english],
            ] as [Language, string][]).map(([value, label]) => (
              <button
                key={value}
                className={clsx(styles.chipButton, language === value && styles.chipButtonActive)}
                onClick={() => onChange(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeatGrid({
  layout,
  seats,
  emptyLabel,
}: {
  layout: { rows: number; pairsPerRow: number };
  seats?: SeatPlanRecord["seats"];
  emptyLabel: string;
}) {
  const positions = buildSeatPositions(layout);

  return (
    <>
      {Array.from({ length: layout.rows }, (_, index) => index + 1).map((row) => {
        const rowPositions = positions.filter((position) => position.row === row);

        return (
          <div className={styles.layoutRow} key={row}>
            <div className={styles.rowBadge}>{row}</div>
            <div className={styles.pairTrack}>
              {Array.from({ length: layout.pairsPerRow }, (_, pairIndex) => pairIndex + 1).map(
                (pair) => {
                  const pairSeats = rowPositions.filter((position) => position.pair === pair);

                  return (
                    <div className={styles.pair} key={`${row}-${pair}`}>
                      {pairSeats.map((position) => {
                        const assigned = seats?.find((seat) => seat.seatId === position.seatId);

                        return (
                          <div className={styles.seat} key={position.seatId}>
                            <span className={styles.seatName}>
                              {assigned?.studentName ?? emptyLabel}
                            </span>
                            <span
                              className={clsx(
                                styles.seatMeta,
                                !assigned?.studentName && styles.seatEmpty,
                              )}
                            >
                              {position.side === "left" ? "L" : "R"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
