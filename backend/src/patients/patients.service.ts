import { Injectable } from '@nestjs/common';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { CheckInDto } from '../check-in/dto/check-in.dto';

/** In-memory patient record for sync across devices. */
export interface StoredPatient {
  id: string;
  waitStart: number;
  vulnerabilityScore: number;
  burdenIndex: number;
  alertLevel: string;
  flags: RegisterPatientDto['flags'];
  checkIns: Array<{
    discomfort: number;
    needsHelp: boolean;
    planningToLeave: boolean;
    timestamp: number;
  }>;
  missedCheckIn?: boolean;
  assignedHospitalKey: string;
  estimatedCtasLevel?: number;
  discomfortLevel?: number;
  disengagementWindowMinutes?: number;
}

const CHECK_IN_INTERVAL_MS = 20 * 60 * 1000;

@Injectable()
export class PatientsService {
  private readonly patients = new Map<string, StoredPatient>();

  register(dto: RegisterPatientDto): StoredPatient {
    const patient: StoredPatient = {
      id: dto.id,
      waitStart: dto.waitStart,
      vulnerabilityScore: dto.vulnerabilityScore,
      burdenIndex: dto.burdenIndex ?? 0,
      alertLevel: dto.alertLevel ?? 'green',
      flags: dto.flags,
      checkIns: dto.checkIns ?? [],
      assignedHospitalKey: dto.assignedHospitalKey,
      estimatedCtasLevel: dto.estimatedCtasLevel,
      discomfortLevel: dto.discomfortLevel,
    };
    this.patients.set(dto.id, patient);
    return patient;
  }

  /** Return all patients (single source of truth for staff/admin). */
  getAll(): StoredPatient[] {
    return Array.from(this.patients.values());
  }

  getByHospital(hospitalKey: string): StoredPatient[] {
    return Array.from(this.patients.values()).filter(
      (p) => p.assignedHospitalKey === hospitalKey,
    );
  }

  getById(id: string): StoredPatient | undefined {
    return this.patients.get(id);
  }

  /** Append a check-in to the patient and update missedCheckIn. */
  addCheckIn(dto: CheckInDto): StoredPatient | undefined {
    const patient = this.patients.get(dto.passportId);
    if (!patient) return undefined;

    const checkIn = {
      discomfort: dto.discomfortLevel,
      needsHelp: !!(dto.assistanceRequested?.length),
      planningToLeave: !dto.intendsToStay,
      timestamp: dto.timestamp ? new Date(dto.timestamp).getTime() : Date.now(),
    };
    patient.checkIns.push(checkIn);
    const now = Date.now();
    const lastTs = patient.checkIns[patient.checkIns.length - 1].timestamp;
    patient.missedCheckIn = now - lastTs > CHECK_IN_INTERVAL_MS;

    return patient;
  }
}
