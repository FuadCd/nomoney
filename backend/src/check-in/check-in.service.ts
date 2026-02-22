import { Injectable } from '@nestjs/common';
import { CheckInDto } from './dto/check-in.dto';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class CheckInService {
  constructor(private readonly patientsService: PatientsService) {}

  processCheckIn(dto: CheckInDto) {
    this.patientsService.addCheckIn(dto);

    const riskElevated = dto.discomfortLevel >= 4 || !dto.intendsToStay;

    return {
      accepted: true,
      riskElevated,
      suggestedActions: this.getSuggestedActions(dto),
      nextCheckInMinutes: 20,
    };
  }

  private getSuggestedActions(dto: CheckInDto): string[] {
    const actions: string[] = [];
    if (dto.discomfortLevel >= 4) actions.push('check-in-recommended');
    if (dto.assistanceRequested?.includes('interpreter')) actions.push('interpreter-page-suggested');
    if (dto.assistanceRequested?.includes('quiet-space')) actions.push('quiet-space-availability-check');
    if (!dto.intendsToStay) actions.push('staff-alert-intent-to-leave');
    return actions;
  }
}
