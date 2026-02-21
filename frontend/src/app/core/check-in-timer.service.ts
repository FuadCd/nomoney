import { Injectable } from '@angular/core';
import { Observable, interval, map, startWith } from 'rxjs';
import { CHECK_IN_INTERVAL_MS } from './patient-store.service';

/**
 * Emits every CHECK_IN_INTERVAL_MS (20 min). Use for check-in reminder cadence
 * and for triggering store updates on the 20-min boundary (e.g. missed check-in).
 */
@Injectable({ providedIn: 'root' })
export class CheckInTimerService {
  /** Emits (tick index) every 20 minutes. Subscribe to drive 20-min loop logic. */
  readonly tick$: Observable<number> = interval(CHECK_IN_INTERVAL_MS).pipe(
    startWith(0),
    map((i) => i + 1)
  );
}
