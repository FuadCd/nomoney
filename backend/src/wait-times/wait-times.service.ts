import { Injectable } from '@nestjs/common';
import { ALBERTA_WAITTIMES_SNAPSHOT } from './alberta-waittimes.snapshot';

export interface ErFacility {
  id: string;
  name: string;
  city: string;
  averageWaitMinutes: number;
  lastUpdated: string;
}

export interface HospitalWithLwbs {
  key: string;
  name: string;
  city: string;
  waitMinutes: number;
  lwbsRate: number;
}

@Injectable()
export class WaitTimesService {
  getSnapshot() {
    return ALBERTA_WAITTIMES_SNAPSHOT;
  }

  getHospitalWaitTime(hospitalKey: string): HospitalWithLwbs | null {
    const hospital = (
      ALBERTA_WAITTIMES_SNAPSHOT.hospitals as Record<
        string,
        { key: string; name: string; city: string; waitMinutes: number; lwbsRate: number }
      >
    )[hospitalKey];
    if (!hospital) return null;
    return hospital;
  }

  /** Normalize around 5% baseline; 5% → 1, 3% → <1, 7% → >1 */
  computeLeaveSignalWeight(hospitalKey: string): number {
    const hospital = this.getHospitalWaitTime(hospitalKey);
    if (!hospital) return 1;
    return hospital.lwbsRate / 0.05;
  }

  getFacilities(): ErFacility[] {
    const hospitals = Object.values(
      ALBERTA_WAITTIMES_SNAPSHOT.hospitals as Record<
        string,
        { name: string; city: string; waitMinutes: number }
      >,
    );
    return hospitals.map((h, i) => ({
      id: String(i + 1),
      name: h.name,
      city: h.city,
      averageWaitMinutes: h.waitMinutes,
      lastUpdated: ALBERTA_WAITTIMES_SNAPSHOT.snapshotTakenAt,
    }));
  }

  getCurrentWaitTimes() {
    return this.getFacilities();
  }
}
