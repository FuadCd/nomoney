import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  Patient,
  CheckIn,
  AlertLevel,
  BurdenCurvePoint,
} from '../models/patient.model';

/** Configurable thresholds for useAlertSystem(); defaults match original 45/70. */
export interface AlertConfig {
  amberThreshold: number; // burdenIndex > this => amber
  redThreshold: number; // burdenIndex > this => red
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  amberThreshold: 45,
  redThreshold: 70,
};

/** Interval after which a check-in is considered missed (20 min). */
export const CHECK_IN_INTERVAL_MS = 20 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PatientStoreService {
  private patients$ = new BehaviorSubject<Patient[]>([]);
  private burdenCurves = new Map<string, BurdenCurvePoint[]>();
  private alertConfig: AlertConfig = { ...DEFAULT_ALERT_CONFIG };
  /** Demo: virtual time advance (ms). getCurrentTime() = Date.now() + this. */
  private demoTimeOffsetMs = 0;
  private readonly logActions = isDevMode();

  // ===== Time (supports demo time-skip) =====
  getCurrentTime(): number {
    return Date.now() + this.demoTimeOffsetMs;
  }

  advanceDemoTime(ms: number): void {
    this.demoTimeOffsetMs += ms;
    this.log('advanceDemoTime', { ms, newOffset: this.demoTimeOffsetMs });
    this.getSnapshot().forEach((p) => this.updateBurden(p.id));
  }

  setAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    this.log('setAlertConfig', this.alertConfig);
    this.getSnapshot().forEach((p) => this.updateBurden(p.id));
  }

  getAlertConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  // ===== Burden curves map (from P1 math engine) =====
  getBurdenCurve(patientId: string): BurdenCurvePoint[] | undefined {
    return this.burdenCurves.get(patientId);
  }

  updateBurdenCurve(patientId: string, curve: BurdenCurvePoint[]): void {
    this.burdenCurves.set(patientId, curve);
    this.log('updateBurdenCurve', { patientId, pointCount: curve.length });
  }

  // ===== Selectors =====
  getPatients() {
    return this.patients$.asObservable();
  }

  getSnapshot() {
    return this.patients$.value;
  }

  getPatientById(id: string): Patient | undefined {
    return this.getSnapshot().find((p) => p.id === id);
  }

  getMissedCheckInPatientIds(): string[] {
    const now = this.getCurrentTime();
    return this.getSnapshot()
      .filter((p) => {
        if (p.checkIns.length === 0) return false;
        const last = p.checkIns[p.checkIns.length - 1];
        return now - last.timestamp > CHECK_IN_INTERVAL_MS;
      })
      .map((p) => p.id);
  }

  // ===== Mutations / Actions =====
  addPatient(patient: Patient) {
    this.log('addPatient', { id: patient.id });
    this.patients$.next([...this.getSnapshot(), patient]);
  }

  updatePatient(updated: Patient) {
    this.log('updatePatient', { id: updated.id });
    const list = this.getSnapshot().map((p) =>
      p.id === updated.id ? updated : p
    );
    this.patients$.next(list);
  }

  addCheckIn(patientId: string, checkIn: CheckIn) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    this.log('addCheckIn', { patientId });
    patient.checkIns.push(checkIn);
    patient.missedCheckIn = false;
    this.updateBurden(patientId);
  }

  /**
   * Apply burden from backend (wait times, LWBS, CIHI/90-min, vulnerability).
   * Used when patient has assignedHospitalKey and burden-modeling API was called.
   */
  setBurdenFromBackend(
    patientId: string,
    burden: number,
    alertStatus: 'GREEN' | 'AMBER' | 'RED',
    curve?: BurdenCurvePoint[],
    disengagementWindowMinutes?: number
  ): void {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    const now = this.getCurrentTime();
    patient.burdenIndex = Math.min(burden, 100);
    patient.alertLevel = alertStatus.toLowerCase() as AlertLevel;
    patient.disengagementWindowMinutes = disengagementWindowMinutes;

    if (patient.checkIns.length > 0) {
      const lastTs = patient.checkIns[patient.checkIns.length - 1].timestamp;
      patient.missedCheckIn = now - lastTs > CHECK_IN_INTERVAL_MS;
    } else {
      patient.missedCheckIn = false;
    }

    if (curve?.length) this.burdenCurves.set(patientId, curve);
    this.log('setBurdenFromBackend', { patientId, burdenIndex: patient.burdenIndex, alertLevel: patient.alertLevel });
    this.updatePatient(patient);
  }

  applyIntervention(patientId: string) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    this.log('applyIntervention', { patientId });
    patient.burdenIndex = Math.max(patient.burdenIndex - 15, 0);
    patient.alertLevel = this.computeAlertLevel(patient);
    this.updatePatient(patient);
  }

  // ===== Core Logic =====
  updateBurden(patientId: string) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    const now = this.getCurrentTime();
    const waitMinutes = (now - patient.waitStart) / 60000;

    const base = Math.min(waitMinutes * 1.5, 60);
    const vulnerabilityMultiplier = 1 + patient.vulnerabilityScore * 1.2;
    const checkInBoost =
      patient.checkIns.length > 0
        ? patient.checkIns[patient.checkIns.length - 1].discomfort * 3
        : 0;

    const burden = base * vulnerabilityMultiplier + checkInBoost;
    patient.burdenIndex = Math.min(burden, 100);
    patient.alertLevel = this.computeAlertLevel(patient);

    // Missed check-in detection: last check-in older than CHECK_IN_INTERVAL_MS
    if (patient.checkIns.length > 0) {
      const lastTs = patient.checkIns[patient.checkIns.length - 1].timestamp;
      patient.missedCheckIn = now - lastTs > CHECK_IN_INTERVAL_MS;
    } else {
      patient.missedCheckIn = false;
    }

    this.log('updateBurden', {
      patientId,
      burdenIndex: patient.burdenIndex,
      alertLevel: patient.alertLevel,
      missedCheckIn: patient.missedCheckIn,
    });
    this.updatePatient(patient);
  }

  private computeAlertLevel(patient: Patient): AlertLevel {
    if (patient.checkIns.some((c) => c.planningToLeave)) return 'red';
    if (patient.burdenIndex > this.alertConfig.redThreshold) return 'red';
    if (patient.burdenIndex > this.alertConfig.amberThreshold) return 'amber';
    return 'green';
  }

  private log(action: string, payload?: unknown) {
    if (this.logActions && typeof console !== 'undefined' && console.log) {
      console.log('[PatientStore]', action, payload ?? '');
    }
  }

  clearDemoTime(): void {
    this.demoTimeOffsetMs = 0;
    this.log('clearDemoTime');
  }
}
