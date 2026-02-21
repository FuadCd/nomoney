export type AlertLevel = 'green' | 'amber' | 'red';

export interface AccessibilityFlags {
  mobility: boolean;
  language: boolean;
  sensory: boolean;
  cognitive: boolean;
  chronicPain: boolean;
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
  waitStart: number; // Date.now()
  vulnerabilityScore: number; // 0-1
  burdenIndex: number; // 0-100
  alertLevel: AlertLevel;
  flags: AccessibilityFlags;
  checkIns: CheckIn[];
  /** True when last check-in was more than CHECK_IN_INTERVAL_MS ago. */
  missedCheckIn?: boolean;
}