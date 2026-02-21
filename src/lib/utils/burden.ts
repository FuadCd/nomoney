// ─── Burden Calculation Utilities ─────────────────────────────────────────

import { MEDIAN_LWBS_TRIGGER_MINUTES } from '../model/modelConstants'
import type { PatientProfile } from '../../types'

export function shouldSuggestAmberCheckIn(
  minutesWaited: number,
  burden: number
): boolean {
  const isPastMedianPhysicianAccess = minutesWaited > 87
  return isPastMedianPhysicianAccess && burden >= 55
}

export function hasMissedCheckIn(
  lastCheckInTime: string | undefined,
  checkInIntervalMs: number
): boolean {
  if (!lastCheckInTime) return false
  const lastCheckIn = new Date(lastCheckInTime).getTime()
  const now = Date.now()
  return now - lastCheckIn > checkInIntervalMs
}

export function shouldShowDisengagementWarning(
  patient: PatientProfile
): boolean {
  const { minutesWaited, burden, checkIns } = patient
  
  // Direct triggers
  if (minutesWaited >= MEDIAN_LWBS_TRIGGER_MINUTES) return true
  if (checkIns.some((c) => c.intendsToStay === false)) return true
  if (burden >= 70) return true
  
  // Credible risk pattern: missed check-in + past early-risk window + elevated burden
  const lastCheckIn = checkIns[checkIns.length - 1]
  if (lastCheckIn) {
    const missedCheckIn = hasMissedCheckIn(lastCheckIn.timestamp, 20 * 60 * 1000)
    if (missedCheckIn && minutesWaited > 87 && burden > 55) {
      return true
    }
  }
  
  return false
}

export function getSuggestedAction(patient: PatientProfile): string {
  const { minutesWaited, burden, checkIns } = patient
  const lastCheckIn = checkIns[checkIns.length - 1]
  
  // Credible risk pattern
  if (shouldShowDisengagementWarning(patient)) {
    const missedCheckIn = lastCheckIn
      ? hasMissedCheckIn(lastCheckIn.timestamp, 20 * 60 * 1000)
      : false
    
    if (missedCheckIn && minutesWaited > 87 && burden > 55) {
      return 'Immediate staff outreach — credible disengagement risk'
    }
  }
  
  // Early check-in suggestion
  if (minutesWaited < 87 && lastCheckIn?.intendsToStay !== false) {
    return 'Accessibility check (optional)'
  }
  
  // Flag-based actions
  const actions: string[] = []
  if (patient.accessibilityProfile.language) {
    actions.push('Interpreter available')
  }
  if (patient.accessibilityProfile.mobility) {
    actions.push('Mobility assistance')
  }
  if (patient.accessibilityProfile.sensory) {
    actions.push('Quiet space offered')
  }
  if (patient.accessibilityProfile.cognitive) {
    actions.push('Clear communication check')
  }
  
  return actions.length > 0 ? actions.join(', ') : 'Monitor'
}
