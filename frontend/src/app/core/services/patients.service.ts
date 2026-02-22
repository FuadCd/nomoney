import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Patient } from '../../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private api: ApiService) {}

  /** Register a new patient (from intake confirm). */
  register(patient: Patient): Observable<Patient> {
    return this.api.post<Patient>('/patients', patient);
  }

  /** Get all patients (for staff/admin). Backend is source of truth. */
  getAll(): Observable<Patient[]> {
    return this.api.get<Patient[]>('/patients');
  }

  /** Get patients for one hospital (filtered by backend). */
  getByHospital(hospitalKey: string): Observable<Patient[]> {
    return this.api.get<Patient[]>(
      `/patients?hospitalKey=${encodeURIComponent(hospitalKey)}`,
    );
  }

  /** Remove patient from queue (sent to doctor / off queue). */
  remove(patientId: string): Observable<{ ok: boolean }> {
    return this.api.delete<{ ok: boolean }>(`/patients/${encodeURIComponent(patientId)}`);
  }

  /** Append check-in; returns updated patient + suggestions. */
  addCheckIn(
    patientId: string,
    body: { discomfortLevel: number; assistanceRequested?: string[]; intendsToStay: boolean; planningToLeaveChoice?: string; timestamp?: string },
  ): Observable<{ patient: Patient | null; suggestedActions: string[]; nextCheckInMinutes: number }> {
    return this.api.post<{ patient: Patient | null; suggestedActions: string[]; nextCheckInMinutes: number }>(
      `/patients/${encodeURIComponent(patientId)}/checkins`,
      body,
    );
  }
}
