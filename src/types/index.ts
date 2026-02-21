// ─── Core Types for AccessER ───────────────────────────────────────────────

// ─── Accessibility Profile ─────────────────────────────────────────────────
export interface VulnerabilityProfile {
  chronicPain?: boolean
  mobility?: boolean
  cognitive?: boolean
  sensory?: boolean
  language?: boolean
  alone?: boolean
}

// ─── Hospital/Facility ─────────────────────────────────────────────────────
export interface Hospital {
  key: string
  name: string
  city: string
  waitMinutes: number
  lwbsRate: number
}

export interface WaitTimesSnapshot {
  source: {
    waitTimes: string
    lwbs: string
  }
  sourceUrl: string
  lwbsUrl: string
  snapshotTakenAt: string
  hospitals: Record<string, Hospital>
}

export type AlbertaHospitalKey = 'uofa' | 'royalAlexandra' | 'greyNuns' | 'misericordia' | 'sturgeon'

// ─── Burden Modeling ───────────────────────────────────────────────────────
export interface BurdenCurvePoint {
  timeMinutes: number
  distressProbability: number
  lwbsProbability: number
  returnVisitRisk: number
}

export interface ComputeBurdenDto {
  facilityId: string
  vulnerabilityMultiplier?: number
  profile?: VulnerabilityProfile
  estimatedCtasLevel: number // 1-5
  waitTimeMinutes: number
  checkInResponses?: CheckInResponse[]
}

export interface BurdenResponse {
  burden: number
  alertStatus: 'GREEN' | 'AMBER' | 'RED'
  suggestAmberCheckIn: boolean
  disengagementWindowMinutes?: number
  burdenCurve: BurdenCurvePoint[]
  equityGapScore: number
  baselineCurve: Array<{
    timeMinutes: number
    distressProbability: number
    lwbsProbability: number
  }>
}

// ─── Check-In ─────────────────────────────────────────────────────────────
export interface CheckInResponse {
  discomfortLevel: number // 1-5
  assistanceRequested?: string[]
  intendsToStay: boolean
  timestamp: string
}

export interface CheckInDto {
  passportId: string
  discomfortLevel: number
  assistanceRequested?: string[]
  intendsToStay: boolean
  timestamp?: string
}

// ─── Patient Profile ───────────────────────────────────────────────────────
export interface PatientProfile {
  id: string
  passportId: string
  assignedHospitalKey: AlbertaHospitalKey
  assignedHospitalName: string
  ctasLevel: number // 1-5
  chiefComplaint: string
  selfReportedUrgency: 'low' | 'medium' | 'high'
  accessibilityProfile: VulnerabilityProfile
  vulnerabilityScore: number // 0-1
  arrivedAt: string // ISO timestamp
  minutesWaited: number
  checkIns: CheckInResponse[]
  burden: number
  alertStatus: 'GREEN' | 'AMBER' | 'RED'
  suggestion: string | null
  equityGapScore: number
  disengagementWindowMinutes?: number
  suggestAmberCheckIn: boolean
  burdenCurve?: BurdenCurvePoint[]
  baselineCurve?: Array<{
    timeMinutes: number
    distressProbability: number
    lwbsProbability: number
  }>
}

// ─── Accessibility Profile Templates ──────────────────────────────────────
export interface ProfileTemplate {
  name: string
  description: string
  profile: VulnerabilityProfile
  vulnerabilityMultiplier: number
}

// ─── Admin Summary ─────────────────────────────────────────────────────────
export interface AdminSummary {
  alertDistribution: {
    green: number
    amber: number
    red: number
    total: number
  }
  averageBurden: number
  missedCheckInRate: number
  equityByFlag: {
    mobility: { avgBurden: number; redPercent: number }
    chronicPain: { avgBurden: number; redPercent: number }
    sensory: { avgBurden: number; redPercent: number }
    cognitive: { avgBurden: number; redPercent: number }
    language: { avgBurden: number; redPercent: number }
    alone: { avgBurden: number; redPercent: number }
  }
}
