/**
 * System actor UUID used when background workers insert into task_events.
 * This is a sentinel UUID that identifies automated/system-generated events
 * as distinct from actions taken by real org members.
 */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001';

// ─── Risk Engine Thresholds ───────────────────────────────────────────────────

/** Hours after assignment before an unstarted task is considered stale (soft risk). */
export const TASK_STALE_ASSIGNMENT_HOURS = 24;

/** Hours a task can remain blocked before it is escalated to hard risk. */
export const TASK_BLOCKED_HARD_RISK_HOURS = 24;

/** Hours after a dependency completes before the downstream task triggers a soft-risk alert. */
export const DEPENDENCY_GAP_SOFT_RISK_HOURS = 12;

// ─── Escalation Processor Thresholds ─────────────────────────────────────────

/** Minimum hours between stage-1 escalation events for the same task. */
export const ESCALATION_STAGE_1_COOLDOWN_HOURS = 12;

/** Minimum hours between stage-2 escalation events for the same task. */
export const ESCALATION_STAGE_2_COOLDOWN_HOURS = 24;

/** Minimum hours between stage-3 escalation events for the same task. */
export const ESCALATION_STAGE_3_COOLDOWN_HOURS = 48;

// ─── Reminder Engine Windows ──────────────────────────────────────────────────

/** Lower bound (inclusive) of the 24-hour due-date reminder window, in hours. */
export const REMINDER_24H_WINDOW_LOWER = 23;

/** Upper bound (exclusive) of the 24-hour due-date reminder window, in hours. */
export const REMINDER_24H_WINDOW_UPPER = 25;
