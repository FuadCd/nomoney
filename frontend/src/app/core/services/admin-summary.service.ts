import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PatientStoreService } from '../patient-store.service';
import { Patient, AccessibilityFlags } from '../../models/patient.model';

/** Flags used for equity breakdown. */
const EQUITY_FLAGS = [
  'mobility',
  'chronicPain',
  'sensory',
  'cognitive',
  'language',
  'alone',
] as const;

export type EquityFlagKey = (typeof EQUITY_FLAGS)[number];

const LWBS_RISK_THRESHOLD = 0.3; // 30% = high LWBS risk

export interface AdminSummary {
  totalPatients: number;
  avgBurden: number;
  alertDistribution: {
    green: number;
    amber: number;
    red: number;
    greenPercent: number;
    amberPercent: number;
    redPercent: number;
  };
  missedCheckInRate: number;
  avgBurdenByFlag: Record<EquityFlagKey, number>;
  redRateByFlag: Record<EquityFlagKey, number>;
  countByFlag: Record<EquityFlagKey, number>;
  /** Average LWBS risk across patients with burden curves (0–100). */
  avgLwbsRisk: number;
  /** Count of patients above LWBS risk threshold (30%). */
  highLwbsRiskCount: number;
  /** % of patients above LWBS risk threshold. */
  highLwbsRiskPercent: number;
}

function hasFlag(flags: AccessibilityFlags | undefined, key: EquityFlagKey): boolean {
  return !!flags?.[key];
}

function toAlertStatusUpper(level: string): 'GREEN' | 'AMBER' | 'RED' {
  const u = level?.toUpperCase() ?? '';
  return u === 'GREEN' || u === 'AMBER' || u === 'RED' ? u : 'GREEN';
}

/**
 * Computes read-only admin summary from the patient store.
 * No backend — patient state is frontend-only.
 */
@Injectable({ providedIn: 'root' })
export class AdminSummaryService {
  private store = inject(PatientStoreService);

  getSummary$(): Observable<AdminSummary> {
    return this.store.getPatients().pipe(map((patients) => this.compute(patients)));
  }

  compute(patients: Patient[]): AdminSummary {
    const total = patients.length;

    const green = patients.filter((p) => toAlertStatusUpper(p.alertLevel) === 'GREEN').length;
    const amber = patients.filter((p) => toAlertStatusUpper(p.alertLevel) === 'AMBER').length;
    const red = patients.filter((p) => toAlertStatusUpper(p.alertLevel) === 'RED').length;

    const alertDistribution = {
      green,
      amber,
      red,
      greenPercent: total ? Math.round((green / total) * 100) : 0,
      amberPercent: total ? Math.round((amber / total) * 100) : 0,
      redPercent: total ? Math.round((red / total) * 100) : 0,
    };

    const avgBurden = total
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.burdenIndex ?? 0), 0) / total
        )
      : 0;

    const missed = patients.filter((p) => p.missedCheckIn).length;
    const missedCheckInRate = total ? Math.round((missed / total) * 100) : 0;

    const avgBurdenByFlag = {} as Record<EquityFlagKey, number>;
    const redRateByFlag = {} as Record<EquityFlagKey, number>;
    const countByFlag = {} as Record<EquityFlagKey, number>;

    for (const key of EQUITY_FLAGS) {
      const subset = patients.filter((p) => hasFlag(p.flags, key));
      const n = subset.length;
      countByFlag[key] = n;
      avgBurdenByFlag[key] = n
        ? Math.round(
            subset.reduce((s, p) => s + (p.burdenIndex ?? 0), 0) / n
          )
        : 0;
      const redCount = subset.filter((p) => toAlertStatusUpper(p.alertLevel) === 'RED').length;
      redRateByFlag[key] = n ? Math.round((redCount / n) * 100) : 0;
    }

    const lwbsRisks = patients
      .map((p) => {
        const curve = this.store.getBurdenCurve(p.id);
        if (!curve?.length) return null;
        const last = curve[curve.length - 1];
        return last.lwbsProbability ?? 0;
      })
      .filter((v): v is number => v !== null);
    const withCurves = lwbsRisks.length;
    const avgLwbsRisk = withCurves
      ? Math.round(
          (lwbsRisks.reduce((s, v) => s + v, 0) / withCurves) * 100
        )
      : 0;
    const highLwbsRiskCount = lwbsRisks.filter(
      (v) => v >= LWBS_RISK_THRESHOLD
    ).length;
    const highLwbsRiskPercent = total
      ? Math.round((highLwbsRiskCount / total) * 100)
      : 0;

    return {
      totalPatients: total,
      avgBurden,
      alertDistribution,
      missedCheckInRate,
      avgBurdenByFlag,
      redRateByFlag,
      countByFlag,
      avgLwbsRisk,
      highLwbsRiskCount,
      highLwbsRiskPercent,
    };
  }
}
