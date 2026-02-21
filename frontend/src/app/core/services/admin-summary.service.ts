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

export interface AdminSummary {
  totalPatients: number;
  avgBurden: number;
  alertDistribution: {
    greenPercent: number;
    amberPercent: number;
    redPercent: number;
  };
  missedCheckInRate: number;
  avgBurdenByFlag: Record<EquityFlagKey, number>;
  redRateByFlag: Record<EquityFlagKey, number>;
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

    for (const key of EQUITY_FLAGS) {
      const subset = patients.filter((p) => hasFlag(p.flags, key));
      const n = subset.length;
      avgBurdenByFlag[key] = n
        ? Math.round(
            subset.reduce((s, p) => s + (p.burdenIndex ?? 0), 0) / n
          )
        : 0;
      const redCount = subset.filter((p) => toAlertStatusUpper(p.alertLevel) === 'RED').length;
      redRateByFlag[key] = n ? Math.round((redCount / n) * 100) : 0;
    }

    return {
      totalPatients: total,
      avgBurden,
      alertDistribution,
      missedCheckInRate,
      avgBurdenByFlag,
      redRateByFlag,
    };
  }
}
