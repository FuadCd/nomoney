import { Injectable } from '@nestjs/common';
import { ComputeBurdenDto } from './dto/compute-burden.dto';
import { WaitTimesService } from '../wait-times/wait-times.service';

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

    const hospital = this.waitTimesService.getHospitalWaitTime(dto.facilityId);
    const expectedWait = hospital?.waitMinutes ?? 180;
    const leaveSignalWeight =
      this.waitTimesService.computeLeaveSignalWeight(dto.facilityId);

    const planningToLeave = dto.checkInResponses?.some(
      (r) => r.intendsToStay === false,
    );

    for (let t = 0; t <= maxTime; t += 5) {
      const baseWaitingImpact = Math.min((t / expectedWait) * 50, 60);
      const baselineHazard = this.baselineHazard(t, dto.estimatedCtasLevel);
      let risk =
        baselineHazard *
        dto.vulnerabilityMultiplier *
        (1 + baseWaitingImpact / 100);

      // Scale LWBS curve by environment-level disengagement context
      const lwbsRisk = risk * leaveSignalWeight;

      points.push({
        timeMinutes: t,
        distressProbability: Math.min(0.95, this.distressCurve(t, risk)),
        lwbsProbability: Math.min(0.95, this.lwbsCurve(t, lwbsRisk)),
        returnVisitRisk: Math.min(0.8, this.returnVisitCurve(t, risk)),
      });
    }

    let burden = this.computeBurdenScore(points, dto);

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
