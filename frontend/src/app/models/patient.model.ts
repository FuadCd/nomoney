export type AlertLevel = 'green' | 'amber' | 'red';

export interface AccessibilityFlags {
  mobility: boolean;
  language: boolean;
  sensory: boolean;
  cognitive: boolean;
  chronicPain: boolean;
  /** I am here alone without support (vulnerability weight 0.10). */
  alone: boolean;
}

export interface CheckIn {
  discomfort: number; // 1-5
  needsHelp: boolean;
  planningToLeave: boolean;
  timestamp: number; // Date.now()
}

/** Per-patient burden curve from math engine (P1). Store holds these via updateBurdenCurve(). */
export interface BurdenCurvePoint {
  timeMinutes: number;
  distressProbability: number;
  lwbsProbability: number;
  returnVisitRisk: number;
}

export interface Patient {
  id: string;
  waitStart: number; // Date.now() — set on Confirm & Check In
  vulnerabilityScore: number; // 0-1, from intake toggles (weights sum)
  burdenIndex: number; // 0-100
  alertLevel: AlertLevel;
  flags: AccessibilityFlags;
  checkIns: CheckIn[];
  /** True when last check-in was more than CHECK_IN_INTERVAL_MS ago. */
  missedCheckIn?: boolean;
  /** Hospital key for backend burden (e.g. uofa). Set from intake or default. */
  assignedHospitalKey?: string;
  /** CTAS level 1–5 for backend burden (1 = most urgent). From intake discomfort 1–5. */
  estimatedCtasLevel?: number;
  /** From intake: "Are you thinking about leaving?" Drives LWBS burden (+15 * leaveSignalWeight). */
  intendsToStay?: boolean;
  /** From intake: discomfort 1–5 (1=Minimal, 5=Severe). Used in burden when no check-ins yet. */
  discomfortLevel?: number;
  /** From backend when at disengagement risk: expected minutes until leave (for staff dashboard). */
  disengagementWindowMinutes?: number;
}