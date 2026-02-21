import { Injectable } from '@nestjs/common';
import { ComputeBurdenDto } from './dto/compute-burden.dto';
import { WaitTimesService } from '../wait-times/wait-times.service';
import {
  MEDIAN_TOTAL_STAY_MINUTES,
  MEDIAN_TO_PHYSICIAN_MINUTES,
} from './modelConstants';

export interface BurdenCurvePoint {
  timeMinutes: number;
  distressProbability: number;
  lwbsProbability: number;
  returnVisitRisk: number;
}

@Injectable()
export class BurdenModelingService {
  private readonly MONTE_CARLO_ITERATIONS = 200;

  constructor(private readonly waitTimesService: WaitTimesService) {}

  computeBurden(dto: ComputeBurdenDto) {
    const points: BurdenCurvePoint[] = [];
    const maxTime = Math.min(180, dto.waitTimeMinutes + 60); // Up to 3 hours

    const leaveSignalWeight =
      this.waitTimesService.computeLeaveSignalWeight(dto.facilityId);

    const planningToLeave = dto.checkInResponses?.some(
      (r) => r.intendsToStay === false,
    );

    for (let t = 0; t <= maxTime; t += 5) {
      const baselineHazard = this.baselineHazard(t, dto.estimatedCtasLevel);
      const risk = baselineHazard * dto.vulnerabilityMultiplier;

      // Scale LWBS curve by environment-level disengagement context (HQCA)
      const lwbsRisk = risk * leaveSignalWeight;

      points.push({
        timeMinutes: t,
        distressProbability: Math.min(0.95, this.distressCurve(t, risk)),
        lwbsProbability: Math.min(0.95, this.lwbsCurve(t, lwbsRisk)),
        returnVisitRisk: Math.min(0.8, this.returnVisitCurve(t, risk)),
      });
    }

    let burden = this.computeBurdenScore(points, dto);

    // CIHI-anchored time-based burden (controls the time curve)
    burden += this.computeBaseWaitingImpact(dto.waitTimeMinutes);

    // LWBS escalation for planning-to-leave (HQCA)
    if (planningToLeave) {
      burden += 15 * leaveSignalWeight;
    }

    const equityGapScore = this.computeEquityGap(
      points,
      dto.vulnerabilityMultiplier,
    );
    const alertStatus =
      burden > 75 || planningToLeave ? 'RED' : burden > 50 ? 'AMBER' : 'GREEN';

    return {
      burdenCurve: points,
      equityGapScore,
      burden,
      alertStatus,
      baselineCurve: points.map((p) => ({
        timeMinutes: p.timeMinutes,
        distressProbability: p.distressProbability / dto.vulnerabilityMultiplier,
        lwbsProbability: p.lwbsProbability / dto.vulnerabilityMultiplier,
      })),
      confidenceInterval: 0.95,
    };
  }

  /** CIHI-anchored: 0 min → 0, 238 min → ~60, acceleration after 90 min */
  private computeBaseWaitingImpact(minutesWaited: number): number {
    const normalized = minutesWaited / MEDIAN_TOTAL_STAY_MINUTES;
    let impact = Math.min(normalized * 60, 60);
    if (minutesWaited > MEDIAN_TO_PHYSICIAN_MINUTES) {
      impact += 8;
    }
    return Math.min(impact, 75);
  }

  private computeBurdenScore(
    points: BurdenCurvePoint[],
    dto: ComputeBurdenDto,
  ): number {
    const lastPoint = points[points.length - 1];
    if (!lastPoint) return 0;
    const base =
      lastPoint.distressProbability * 30 +
      lastPoint.lwbsProbability * 40 +
      lastPoint.returnVisitRisk * 20;
    return Math.min(100, base * dto.vulnerabilityMultiplier);
  }

  private baselineHazard(timeMinutes: number, ctasLevel: number): number {
    const urgencyFactor = 6 - ctasLevel; // CTAS 1 = highest urgency
    return 0.001 * Math.exp(0.02 * timeMinutes) * urgencyFactor;
  }

  private distressCurve(timeMinutes: number, risk: number): number {
    return 1 - Math.exp(-risk * timeMinutes * 0.01);
  }

  private lwbsCurve(timeMinutes: number, risk: number): number {
    return 1 - Math.exp(-risk * timeMinutes * 0.008);
  }

  private returnVisitCurve(timeMinutes: number, risk: number): number {
    return (1 - Math.exp(-risk * 0.5)) * (timeMinutes / 120);
  }

  private computeEquityGap(
    points: BurdenCurvePoint[],
    vulnerabilityMultiplier: number,
  ): number {
    const lastPoint = points[points.length - 1];
    if (!lastPoint) return 0;
    const baselineLwbs = lastPoint.lwbsProbability / vulnerabilityMultiplier;
    return lastPoint.lwbsProbability - baselineLwbs;
  }
}
