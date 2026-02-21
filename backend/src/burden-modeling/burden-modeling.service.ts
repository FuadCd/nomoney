import { Injectable } from '@nestjs/common';
import { ComputeBurdenDto } from './dto/compute-burden.dto';
import { WaitTimesService } from '../wait-times/wait-times.service';
import {
  MEDIAN_TOTAL_STAY_MINUTES,
  MEDIAN_TO_PHYSICIAN_MINUTES,
  MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES,
  MEDIAN_LWBS_TRIGGER_MINUTES,
} from './modelConstants';
import { VULNERABILITY_WEIGHTS } from './vulnerabilityWeights';
import { EstimatedWaitDto } from './dto/estimated-wait.dto';

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

    const vulnerabilityMultiplier = dto.profile
      ? this.computeVulnerabilityMultiplier(dto.profile)
      : (dto.vulnerabilityMultiplier ?? 1);

    const leaveSignalWeight =
      this.waitTimesService.computeLeaveSignalWeight(dto.facilityId);

    const planningToLeave = dto.checkInResponses?.some(
      (r) => r.intendsToStay === false,
    );

    for (let t = 0; t <= maxTime; t += 5) {
      const baselineHazard = this.baselineHazard(t, dto.estimatedCtasLevel);
      const risk = baselineHazard * vulnerabilityMultiplier;

      // Scale LWBS curve by environment-level disengagement context (HQCA)
      const lwbsRisk = risk * leaveSignalWeight;

      points.push({
        timeMinutes: t,
        distressProbability: Math.min(0.95, this.distressCurve(t, risk)),
        lwbsProbability: Math.min(0.95, this.lwbsCurve(t, lwbsRisk)),
        returnVisitRisk: Math.min(0.8, this.returnVisitCurve(t, risk)),
      });
    }

    let burden = this.computeBurdenScore(points, vulnerabilityMultiplier);

    // CIHI-anchored time-based burden (controls the time curve)
    burden += this.computeBaseWaitingImpact(dto.waitTimeMinutes);

    // LWBS escalation for planning-to-leave (HQCA)
    if (planningToLeave) {
      burden += 15 * leaveSignalWeight;
    }

    // Post-87 min gradual escalation (McMaster reference)
    burden = this.applyPostMedianPhysicianDelayAdjustment(
      burden,
      dto.waitTimeMinutes,
    );

    // Vulnerability scaling (StatsCan-informed weights)
    burden = burden * (1 + vulnerabilityMultiplier);
    burden = Math.max(0, Math.min(100, burden));

    const isPastMedianPhysicianAccess =
      dto.waitTimeMinutes > MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES;
    const suggestAmberCheckIn =
      isPastMedianPhysicianAccess && burden >= 55;

    const equityGapScore = this.computeEquityGap(
      points,
      vulnerabilityMultiplier,
    );
    const alertStatus =
      burden > 75 || planningToLeave ? 'RED' : burden > 50 ? 'AMBER' : 'GREEN';

    const hospital = this.waitTimesService.getHospitalWaitTime(dto.facilityId);
    const expectedWaitMinutes = hospital?.waitMinutes ?? 238;
    const waitRatio = dto.waitTimeMinutes / expectedWaitMinutes;

    const atDisengagementRisk =
      planningToLeave ||
      burden >= 70 ||
      dto.waitTimeMinutes >= MEDIAN_LWBS_TRIGGER_MINUTES ||
      waitRatio >= 0.3;

    const disengagementWindowMinutes = atDisengagementRisk
      ? this.computeDisengagementWindowMinutes(
          points,
          dto.waitTimeMinutes,
        )
      : undefined;

    return {
      burdenCurve: points,
      equityGapScore,
      burden,
      alertStatus,
      disengagementWindowMinutes,
      baselineCurve: points.map((p) => ({
        timeMinutes: p.timeMinutes,
        distressProbability: p.distressProbability / vulnerabilityMultiplier,
        lwbsProbability: p.lwbsProbability / vulnerabilityMultiplier,
      })),
      confidenceInterval: 0.95,
    };
  }

  /**
   * Curve-based window; displayed as "~30–60 min" range, not a point estimate.
   */
  private computeDisengagementWindowMinutes(
    points: BurdenCurvePoint[],
    waitTimeMinutes: number,
  ): number {
    const LWBS_THRESHOLD = 0.5;
    const MIN_MINUTES = 5;
    const MAX_MINUTES = 60;
    const DEFAULT_MINUTES = 20;

    const point = points.find((p) => p.lwbsProbability >= LWBS_THRESHOLD);
    if (!point) return DEFAULT_MINUTES;
    const minutesFromNow = point.timeMinutes - waitTimeMinutes;
    if (minutesFromNow <= 0) return MIN_MINUTES;
    return Math.round(Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutesFromNow)));
  }

  /**
   * Estimated wait in minutes for display after signup.
   * Uses: hospital baseline, waiting impact vs median, 90-min threshold, vulnerability.
   * LWBS is not included (check-in only).
   */
  getEstimatedWaitMinutes(dto: EstimatedWaitDto): { estimatedWaitMinutes: number } {
    const hospital = this.waitTimesService.getHospitalWaitTime(dto.facilityId);
    const baseWait = hospital?.waitMinutes ?? 180;

    // Scale base wait: vulnerability reduces displayed wait (equity prioritization)
    const vulnerabilityFactor = 1 / Math.max(0.5, Math.min(2, dto.vulnerabilityMultiplier));
    let estimated = baseWait * vulnerabilityFactor;

    // After 90 min, show remaining-style estimate: reduce by time already waited
    if (dto.waitTimeMinutes > MEDIAN_TO_PHYSICIAN_MINUTES) {
      const remaining = Math.max(0, baseWait - dto.waitTimeMinutes);
      estimated = remaining * vulnerabilityFactor;
    }

    const clamped = Math.round(Math.max(15, Math.min(600, estimated)));
    return { estimatedWaitMinutes: clamped };
  }

  /** +0 to +10 gradual bump after 87 min (McMaster triage-matched control median) */
  private applyPostMedianPhysicianDelayAdjustment(
    burden: number,
    minutesWaited: number,
  ): number {
    if (minutesWaited <= MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES)
      return burden;
    const over =
      minutesWaited - MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES;
    const bump = Math.min(over * 0.1, 10);
    return burden + bump;
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
    vulnerabilityMultiplier: number,
  ): number {
    const lastPoint = points[points.length - 1];
    if (!lastPoint) return 0;
    const base =
      lastPoint.distressProbability * 30 +
      lastPoint.lwbsProbability * 40 +
      lastPoint.returnVisitRisk * 20;
    return Math.min(100, base * vulnerabilityMultiplier);
  }

  /** Returns 0 → ~0.95 from profile flags (StatsCan-informed weights) */
  private computeVulnerabilityMultiplier(profile: {
    chronicPain?: boolean;
    mobility?: boolean;
    cognitive?: boolean;
    sensory?: boolean;
    language?: boolean;
    alone?: boolean;
  }): number {
    let totalWeight = 0;
    for (const key of Object.keys(
      VULNERABILITY_WEIGHTS,
    ) as (keyof typeof VULNERABILITY_WEIGHTS)[]) {
      if (profile[key]) {
        totalWeight += VULNERABILITY_WEIGHTS[key];
      }
    }
    return totalWeight;
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
