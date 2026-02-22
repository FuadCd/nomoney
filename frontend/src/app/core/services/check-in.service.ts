import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PatientsService } from './patients.service';
import { Patient } from '../../models/patient.model';

export interface CheckInInput {
  passportId: string;
  discomfortLevel: number;
  assistanceRequested?: string[];
  intendsToStay: boolean;
  timestamp?: string;
}

export interface CheckInResponse {
  patient: Patient | null;
  suggestedActions: string[];
  nextCheckInMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  constructor(private patientsApi: PatientsService) {}

  /** POST to backend (single source of truth). No local store update. */
  submitCheckIn(input: CheckInInput): Observable<CheckInResponse> {
    const { passportId, ...body } = input;
    return this.patientsApi.addCheckIn(passportId, body);
  }
}
