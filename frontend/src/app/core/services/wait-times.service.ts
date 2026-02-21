import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ErFacility {
  id: string;
  name: string;
  city: string;
  averageWaitMinutes: number;
  lastUpdated: string;
}

/** Single hospital from backend (GET /wait-times/:hospitalKey). Used for patient estimated wait. */
export interface HospitalWaitTime {
  key: string;
  name: string;
  city: string;
  waitMinutes: number;
  lwbsRate?: number;
}

@Injectable({ providedIn: 'root' })
export class WaitTimesService {
  constructor(private api: ApiService) {}

  getFacilities(): Observable<ErFacility[]> {
    return this.api.get<ErFacility[]>('/wait-times/facilities');
  }

  getCurrentWaitTimes(): Observable<ErFacility[]> {
    return this.api.get<ErFacility[]>('/wait-times/current');
  }

  /** Full snapshot (GET /wait-times). Used as fallback for estimated wait. */
  getSnapshot(): Observable<{ hospitals: Record<string, HospitalWaitTime> }> {
    return this.api.get<{ hospitals: Record<string, HospitalWaitTime> }>('/wait-times');
  }

  /** Fetch expected wait for one hospital (backend snapshot). Used for patient estimated wait. */
  getHospitalWaitTime(hospitalKey: string): Observable<HospitalWaitTime | null> {
    return this.api.get<HospitalWaitTime | { error: string }>(`/wait-times/${hospitalKey}`).pipe(
      map((res) => ('error' in res ? null : res)),
      catchError(() =>
        this.getSnapshot().pipe(
          map((snap) => snap.hospitals?.[hospitalKey] ?? null)
        )
      )
    );
  }
}
