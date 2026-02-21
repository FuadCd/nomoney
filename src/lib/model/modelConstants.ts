// ─── Model Constants (CIHI + McMaster) ────────────────────────────────────

/**
 * Source:
 * CIHI NACRS Emergency Department Visits and Lengths of Stay
 * https://www.cihi.ca/en/nacrs-emergency-department-visits-and-lengths-of-stay
 *
 * Alberta median values (2024–2025 final data)
 */

// Median total ED stay (minutes)
export const MEDIAN_TOTAL_STAY_MINUTES = 238

// Median time to physician (minutes)
export const MEDIAN_TO_PHYSICIAN_MINUTES = 90

/**
 * McMaster median time-to-physician among triage-matched controls.
 * Used as reference for "beyond median physician access" (gradual escalation).
 * Source: published ED LWBS study.
 */
export const MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES = 87

/** Gate for disengagement warning — only show when waited this long or planning to leave or burden ≥ 70. */
export const MEDIAN_LWBS_TRIGGER_MINUTES = 87

/** Check-in interval (20 minutes) */
export const CHECK_IN_INTERVAL_MS = 20 * 60 * 1000
