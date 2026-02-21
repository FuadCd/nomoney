import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface BurdenCurvePoint {
  timeMinutes: number;
  distressProbability: number;
  lwbsProbability: number;
  returnVisitRisk: number;
}

export interface VulnerabilityProfile {
  chronicPain?: boolean;
  mobility?: boolean;
  cognitive?: boolean;
  sensory?: boolean;
  language?: boolean;
  alone?: boolean;
}

export interface ComputeBurdenInput {
  facilityId: string;
  vulnerabilityMultiplier?: number;
  profile?: VulnerabilityProfile;
  estimatedCtasLevel: number;
  waitTimeMinutes: number;
  checkInResponses?: {
    discomfortLevel?: number;
    assistanceRequested?: string[];
    intendsToStay?: boolean;
    timestamp: string;
  }[];
}

export interface EstimatedWaitInput {
  facilityId: string;
  vulnerabilityMultiplier: number;
  estimatedCtasLevel: number;
  waitTimeMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class BurdenModelingService {
  constructor(private api: ApiService) {}

  getEstimatedWaitMinutes(input: EstimatedWaitInput): Observable<{ estimatedWaitMinutes: number }> {
    return this.api.post('/burden-modeling/estimated-wait', input);
  }

  computeBurden(input: ComputeBurdenInput): Observable<{
    burdenCurve: BurdenCurvePoint[];
    equityGapScore: number;
    burden: number;
    alertStatus: 'GREEN' | 'AMBER' | 'RED';
    suggestAmberCheckIn?: boolean;
    disengagementWindowMinutes?: number;
    baselineCurve: unknown[];
    confidenceInterval: number;
  }> {
    return this.api.post('/burden-modeling/compute', input);
  }
}
