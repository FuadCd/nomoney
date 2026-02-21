import { Injectable, OnDestroy } from '@angular/core';
import { PatientStoreService } from './patient-store.service';
import { CheckInTimerService } from './check-in-timer.service';
import { BurdenModelingService } from './services/burden-modeling.service';

const BURDEN_UPDATE_INTERVAL_MS = 30_000;

/**
 * Runs periodic burden updates. When a patient has assignedHospitalKey,
 * calls backend burden-modeling (wait times, LWBS, CIHI/90-min, vulnerability);
 * otherwise uses local store computation.
 */
@Injectable({ providedIn: 'root' })
export class BurdenUpdaterService implements OnDestroy {
  private burdenIntervalId: ReturnType<typeof setInterval> | null = null;
  private checkInTickSub: { unsubscribe: () => void } | null = null;

  constructor(
    private store: PatientStoreService,
    private checkInTimer: CheckInTimerService,
    private burdenModeling: BurdenModelingService
  ) {
    this.burdenIntervalId = setInterval(() => this.refreshAllBurden(), BURDEN_UPDATE_INTERVAL_MS);
    this.checkInTickSub = this.checkInTimer.tick$.subscribe(() => this.refreshAllBurden());
  }

  /** Call from Staff Dashboard to refresh burden after time controls (e.g. Add +15 min, Reset time). */
  refreshAll(): void {
    this.refreshAllBurden();
  }

  private refreshAllBurden(): void {
    const now = this.store.getCurrentTime();
    this.store.getSnapshot().forEach((p) => {
      if (p.assignedHospitalKey) {
        const waitTimeMinutes = (now - p.waitStart) / 60_000;
        const checkInResponses = (p.checkIns ?? []).map((c) => ({
          discomfortLevel: c.discomfort,
          assistanceRequested: c.needsHelp ? ['assistance'] : [],
          intendsToStay: !c.planningToLeave,
          timestamp: new Date(c.timestamp).toISOString(),
        }));
        this.burdenModeling
          .computeBurden({
            facilityId: p.assignedHospitalKey,
            vulnerabilityMultiplier: 1 + p.vulnerabilityScore,
            estimatedCtasLevel: p.estimatedCtasLevel ?? 3,
            waitTimeMinutes: Math.round(waitTimeMinutes),
            checkInResponses,
          })
          .subscribe({
            next: (res) => {
              if (res.burden != null && res.alertStatus) {
                this.store.setBurdenFromBackend(
                  p.id,
                  res.burden,
                  res.alertStatus,
                  res.burdenCurve,
                  res.disengagementWindowMinutes
                );
              }
            },
            error: () => this.store.updateBurden(p.id),
          });
      } else {
        this.store.updateBurden(p.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.burdenIntervalId !== null) {
      clearInterval(this.burdenIntervalId);
      this.burdenIntervalId = null;
    }
    this.checkInTickSub?.unsubscribe();
    this.checkInTickSub = null;
  }
}
