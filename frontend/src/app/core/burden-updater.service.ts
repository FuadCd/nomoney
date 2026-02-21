import { Injectable, OnDestroy } from '@angular/core';
import { PatientStoreService } from './patient-store.service';
import { CheckInTimerService } from './check-in-timer.service';

/** Interval for periodic burden recompute (seconds). */
const BURDEN_UPDATE_INTERVAL_MS = 30_000;

/**
 * Runs periodic burden updates and 20-min check-in tick. Keeps this logic
 * out of the store so the store stays a pure state container.
 */
@Injectable({ providedIn: 'root' })
export class BurdenUpdaterService implements OnDestroy {
  private burdenIntervalId: ReturnType<typeof setInterval> | null = null;
  private checkInTickSub: { unsubscribe: () => void } | null = null;

  constructor(
    private store: PatientStoreService,
    private checkInTimer: CheckInTimerService
  ) {
    this.burdenIntervalId = setInterval(() => {
      this.store.getSnapshot().forEach((p) => this.store.updateBurden(p.id));
    }, BURDEN_UPDATE_INTERVAL_MS);

    this.checkInTickSub = this.checkInTimer.tick$.subscribe(() => {
      this.store.getSnapshot().forEach((p) => this.store.updateBurden(p.id));
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
