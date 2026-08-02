"use client";

// IPI-579 · PLN-S1B — read-only Timeline (SCR-32-Planner-Workspace.dc.html
// parity). Pure presentational render of the TimelineModel from
// planner-view-model.ts; the model is built server-side (page.tsx), so this
// component never fetches and has no loading/error state of its own —
// those live in the route's loading.tsx / error.tsx. The only state is the
// URL-backed phase selection (usePlannerSelection): a row click selects the
// phase, which AdaptivePanel turns into the read-only phase Detail panel.
//
// Deliberately NOT a charting library, NOT interactive-movement, no mutation
// affordances — the ticket's non-negotiable scope boundary (verify by grep
// before merge: no drag handlers, no charting-lib imports, no date-lib
// imports anywhere in the planner code touched by this ticket).
//
// Grid contract (documented in planner-view-model.ts): one bar per phase
// spanning the phase's inclusive date range; week columns are equal-width;
// the phase-name column is a fixed 180px; TODAY is a vertical line + badge
// positioned by real day offset, not the DC file's hardcoded 46%.

import { AlertTriangle, Flag, Lock } from "lucide-react";

import { daysBetween } from "@/lib/planner/planner-date-utils";
import type { PhaseTimelineStatus, TimelineModel, TimelinePhase } from "@/lib/planner/planner-view-model";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./planner-timeline.module.css";

const STATUS_BAR: Record<PhaseTimelineStatus, string> = {
  done: styles.barDone,
  in_progress: styles.barInProgress,
  blocked: styles.barBlocked,
  at_risk: styles.barAtRisk,
  todo: styles.barTodo,
};

const STATUS_DOT: Record<PhaseTimelineStatus, string> = {
  done: styles.dotDone,
  in_progress: styles.dotInProgress,
  blocked: styles.dotBlocked,
  at_risk: styles.dotAtRisk,
  todo: styles.dotTodo,
};

const GATE_VISUAL: Record<"approved" | "ready" | "locked", string> = {
  approved: styles.gateApproved,
  ready: styles.gateReady,
  locked: styles.gateLocked,
};

const GATE_TITLE: Record<"approved" | "ready" | "locked", string> = {
  approved: "Gate: approved",
  ready: "Gate: ready for approval",
  locked: "Gate: locked",
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Day offset of `today` within the visible range, as a 0–100 percent. */
function todayPercent(model: TimelineModel): number | null {
  if (!model.hasScheduled || !model.rangeStart) return null;
  const offset = daysBetween(model.rangeStart, model.today);
  // Outside the visible window there is no honest position for the marker.
  if (offset < 0 || offset >= model.dayCount) return null;
  // Same day-start convention as phase bar `leftPercent` (no +1).
  return clampPercent((offset / model.dayCount) * 100);
}

function TimelineEmpty() {
  return (
    <div className={styles.empty} data-testid="planner-timeline-empty">
      <div className={styles.emptyTitle}>No steps yet</div>
      <div className={styles.emptyBody}>
        This plan hasn&apos;t been set up. Add steps from a template, or ask the planner assistant
        to draft a schedule.
      </div>
    </div>
  );
}

function WeekHeaderCell({ week }: { week: TimelineModel["weeks"][number] }) {
  return (
    <div className={styles.weekCell} data-testid="planner-timeline-week">
      <div className={styles.weekLabel}>{week.key}</div>
      <div className={styles.weekDate}>{week.label}</div>
    </div>
  );
}

function TodayMarker({ percent }: { percent: number }) {
  return (
    <>
      <span
        className={styles.todayLine}
        style={{ left: `${percent}%` }}
        aria-hidden="true"
        data-testid="planner-timeline-today-line"
      />
      <span className={styles.todayBadge} style={{ left: `${percent}%` }} data-testid="planner-timeline-today-badge">
        TODAY
      </span>
    </>
  );
}

function PhaseBar({ row, selected }: { row: TimelinePhase; selected: boolean }) {
  const width = row.range ? `${row.widthPercent}%` : undefined;
  return (
    <div
      className={`${styles.bar} ${STATUS_BAR[row.status]} ${selected ? styles.barSelected : ""}`}
      style={{ left: `${row.leftPercent}%`, width }}
      data-testid="planner-timeline-bar"
    >
      {row.status === "in_progress" && row.progress !== null && (
        <span className={styles.progressFill} style={{ width: `${row.progress}%` }} aria-hidden="true" />
      )}
      {row.durationLabel && <span className={styles.barText}>{row.durationLabel}</span>}
    </div>
  );
}

function PhaseMarkers({ row }: { row: TimelinePhase }) {
  return (
    <>
      {row.milestone && (
        <span
          className={styles.milestone}
          style={{ left: `calc(${row.leftPercent}% - 5px)` }}
          title="Shoot day"
          aria-hidden="true"
          data-testid="planner-timeline-milestone"
        >
          <Flag size={12} aria-hidden="true" />
        </span>
      )}
      {row.gate && (
        <span
          className={`${styles.gate} ${GATE_VISUAL[row.gate]}`}
          style={{ left: `calc(${row.leftPercent + row.widthPercent}% - 7px)` }}
          title={GATE_TITLE[row.gate]}
          aria-hidden="true"
          data-testid="planner-timeline-gate"
        />
      )}
    </>
  );
}

export function PlannerTimeline({ model }: { model: TimelineModel }) {
  const { selection, setSelection } = usePlannerSelection();

  if (model.phases.length === 0) return <TimelineEmpty />;

  const today = todayPercent(model);
  const weekCount = model.weeks.length;

  const selectPhase = (row: TimelinePhase) => setSelection({ type: "phase", id: row.phase.id });
  const isSelected = (row: TimelinePhase) =>
    selection !== null && selection.type === "phase" && selection.id === row.phase.id;

  return (
    <div data-testid="planner-timeline">
      {model.hasScheduled && (
        <div className={styles.scroll}>
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.headerLabel}>Step</div>
              <div className={styles.weekStrip}>
                {model.weeks.map((week) => (
                  <WeekHeaderCell key={week.key} week={week} />
                ))}
                {today !== null && <TodayMarker percent={today} />}
              </div>
            </div>

            {model.scheduled.map((row) => {
              const selected = isSelected(row);
              return (
                <button
                  key={row.phase.id}
                  type="button"
                  className={styles.row}
                  aria-label={`Select ${row.phase.name} phase, ${row.status.replaceAll("_", " ")}`}
                  aria-pressed={selected}
                  onClick={() => selectPhase(row)}
                  data-testid="planner-timeline-row"
                >
                  <span className={`${styles.labelCell} ${selected ? styles.labelCellSelected : ""}`}>
                    <span className={`${styles.dot} ${STATUS_DOT[row.status]}`} aria-hidden="true" />
                    <span className={styles.name}>{row.phase.name}</span>
                    {(row.gate === "ready" || row.gate === "locked") && (
                      <Lock size={11} aria-hidden="true" className={styles.lockIcon} />
                    )}
                  </span>
                  <span className={styles.barCell}>
                    {Array.from({ length: Math.max(0, weekCount - 1) }, (_, i) => (
                      <span
                        key={i}
                        className={styles.gridline}
                        style={{ left: `${((i + 1) / weekCount) * 100}%` }}
                        aria-hidden="true"
                      />
                    ))}
                    {today !== null && (
                      <span className={styles.rowTodayLine} style={{ left: `${today}%` }} aria-hidden="true" />
                    )}
                    <PhaseBar row={row} selected={selected} />
                    <PhaseMarkers row={row} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {model.unscheduled.length > 0 && (
        <div className={styles.band} data-testid="planner-timeline-band-unscheduled">
          {model.unscheduled.map((row) => (
            <button
              key={row.phase.id}
              type="button"
              className={styles.bandRow}
              aria-label={`Select ${row.phase.name} phase`}
              aria-pressed={isSelected(row)}
              onClick={() => selectPhase(row)}
              data-testid="planner-timeline-band-row"
            >
              <span className={`${styles.dot} ${STATUS_DOT[row.status]}`} aria-hidden="true" />
              <span className={styles.name}>{row.phase.name}</span>
              <span className={styles.bandTag}>Unscheduled — no dates set yet</span>
            </button>
          ))}
        </div>
      )}

      {model.invalid.length > 0 && (
        <div className={styles.band} data-testid="planner-timeline-band-invalid">
          {model.invalid.map((row) => (
            <button
              key={row.phase.id}
              type="button"
              className={`${styles.bandRow} ${styles.bandRowInvalid}`}
              aria-label={`Select ${row.phase.name} phase`}
              aria-pressed={isSelected(row)}
              onClick={() => selectPhase(row)}
              data-testid="planner-timeline-band-row"
            >
              <AlertTriangle size={13} aria-hidden="true" className={styles.invalidIcon} />
              <span className={styles.name}>{row.phase.name}</span>
              <span className={styles.bandTag}>Needs correction — task dates are out of order</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
