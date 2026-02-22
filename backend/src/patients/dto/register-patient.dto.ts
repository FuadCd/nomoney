export class AccessibilityFlagsDto {
  mobility: boolean;
  language: boolean;
  sensory: boolean;
  cognitive: boolean;
  chronicPain: boolean;
  alone: boolean;
}

export class RegisterPatientDto {
  id: string;
  waitStart: number;
  vulnerabilityScore: number;
  burdenIndex?: number;
  alertLevel?: string;
  flags: AccessibilityFlagsDto;
  checkIns?: Array<{
    discomfort: number;
    needsHelp: boolean;
    planningToLeave: boolean;
    timestamp: number;
  }>;
  assignedHospitalKey: string;
  estimatedCtasLevel?: number;
  discomfortLevel?: number;
}
