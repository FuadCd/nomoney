// ─── Admin Summary Calculation ─────────────────────────────────────────────

import type { PatientProfile, AdminSummary } from '../../types'

export function computeAdminSummary(patients: PatientProfile[]): AdminSummary {
  const total = patients.length
  
  // Alert distribution
  const green = patients.filter((p) => p.alertStatus === 'GREEN').length
  const amber = patients.filter((p) => p.alertStatus === 'AMBER').length
  const red = patients.filter((p) => p.alertStatus === 'RED').length
  
  // Average burden
  const averageBurden =
    total > 0
      ? patients.reduce((sum, p) => sum + p.burden, 0) / total
      : 0
  
  // Missed check-in rate
  const now = Date.now()
  const checkInIntervalMs = 20 * 60 * 1000
  const missedCheckIns = patients.filter((p) => {
    const lastCheckIn = p.checkIns[p.checkIns.length - 1]
    if (!lastCheckIn) return true
    return now - new Date(lastCheckIn.timestamp).getTime() > checkInIntervalMs
  }).length
  const missedCheckInRate = total > 0 ? missedCheckIns / total : 0
  
  // Equity by flag
  const equityByFlag = {
    mobility: computeEquityForFlag(patients, 'mobility'),
    chronicPain: computeEquityForFlag(patients, 'chronicPain'),
    sensory: computeEquityForFlag(patients, 'sensory'),
    cognitive: computeEquityForFlag(patients, 'cognitive'),
    language: computeEquityForFlag(patients, 'language'),
    alone: computeEquityForFlag(patients, 'alone'),
  }
  
  return {
    alertDistribution: { green, amber, red, total },
    averageBurden: Math.round(averageBurden * 10) / 10,
    missedCheckInRate: Math.round(missedCheckInRate * 100) / 100,
    equityByFlag,
  }
}

function computeEquityForFlag(
  patients: PatientProfile[],
  flag: keyof PatientProfile['accessibilityProfile']
) {
  const withFlag = patients.filter((p) => p.accessibilityProfile[flag])
  const total = withFlag.length
  
  if (total === 0) {
    return { avgBurden: 0, redPercent: 0 }
  }
  
  const avgBurden =
    withFlag.reduce((sum, p) => sum + p.burden, 0) / total
  const redCount = withFlag.filter((p) => p.alertStatus === 'RED').length
  const redPercent = (redCount / total) * 100
  
  return {
    avgBurden: Math.round(avgBurden * 10) / 10,
    redPercent: Math.round(redPercent * 10) / 10,
  }
}
