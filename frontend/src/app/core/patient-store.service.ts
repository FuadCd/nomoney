import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Patient, CheckIn, AlertLevel } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientStoreService {
  private patients$ = new BehaviorSubject<Patient[]>([]);

  constructor() {
    // Demo mode: recompute burden periodically for all patients
    setInterval(() => {
      this.getSnapshot().forEach((p) => this.updateBurden(p.id));
    }, 30000); // 30 seconds
  }

  // ===== Selectors =====
  getPatients() {
    return this.patients$.asObservable();
  }

  getSnapshot() {
    return this.patients$.value;
  }

  // ===== Mutations / Actions =====
  addPatient(patient: Patient) {
    this.patients$.next([...this.getSnapshot(), patient]);
  }

  updatePatient(updated: Patient) {
    const list = this.getSnapshot().map((p) => (p.id === updated.id ? updated : p));
    this.patients$.next(list);
  }

  addCheckIn(patientId: string, checkIn: CheckIn) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    patient.checkIns.push(checkIn);

    // Recompute based on latest check-in
    this.updateBurden(patientId);
  }

  applyIntervention(patientId: string) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    // Intervention lowers burden slightly (demo-friendly)
    patient.burdenIndex = Math.max(patient.burdenIndex - 15, 0);

    patient.alertLevel = this.computeAlertLevel(patient);

    this.updatePatient(patient);
  }

  // ===== Core Logic =====
  updateBurden(patientId: string) {
    const patient = this.getSnapshot().find((p) => p.id === patientId);
    if (!patient) return;

    const waitMinutes = (Date.now() - patient.waitStart) / 60000;

    // Base waiting impact (caps at 60)
    const base = Math.min(waitMinutes * 1.5, 60);

    // Vulnerability increases burden slope
    const vulnerabilityMultiplier = 1 + patient.vulnerabilityScore * 1.2;

    // Latest check-in adds a bump
    const checkInBoost =
      patient.checkIns.length > 0
        ? patient.checkIns[patient.checkIns.length - 1].discomfort * 3
        : 0;

    const burden = base * vulnerabilityMultiplier + checkInBoost;

    patient.burdenIndex = Math.min(burden, 100);
    patient.alertLevel = this.computeAlertLevel(patient);

    this.updatePatient(patient);
  }

  private computeAlertLevel(patient: Patient): AlertLevel {
    // Immediate red if user indicates they may leave
    if (patient.checkIns.some((c) => c.planningToLeave)) return 'red';

    if (patient.burdenIndex > 70) return 'red';
    if (patient.burdenIndex > 45) return 'amber';
    return 'green';
  }
}