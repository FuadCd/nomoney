import { TestBed } from '@angular/core/testing';
import { PatientStoreService, CHECK_IN_INTERVAL_MS } from './patient-store.service';
import { Patient, CheckIn } from '../models/patient.model';

function makePatient(overrides: Partial<Patient> = {}): Patient {
  const now = Date.now();
  return {
    id: 'p1',
    waitStart: now - 60 * 60 * 1000,
    vulnerabilityScore: 0.5,
    burdenIndex: 0,
    alertLevel: 'green',
    flags: {
      mobility: false,
      language: false,
      sensory: false,
      cognitive: false,
      chronicPain: false,
    },
    checkIns: [],
    ...overrides,
  };
}

describe('PatientStoreService', () => {
  let store: PatientStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PatientStoreService);
  });

  it('addPatient adds to snapshot and getPatients emits', (done) => {
    const p = makePatient({ id: 'a1' });
    store.addPatient(p);
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe('a1');
    store.getPatients().subscribe((list) => {
      expect(list).toHaveLength(1);
      done();
    });
  });

  it('updateBurden updates burdenIndex and alertLevel', () => {
    const p = makePatient({
      id: 'b1',
      waitStart: Date.now() - 90 * 60 * 1000,
      vulnerabilityScore: 0.8,
    });
    store.addPatient(p);
    store.updateBurden('b1');
    const updated = store.getSnapshot().find((x) => x.id === 'b1')!;
    expect(updated.burdenIndex).toBeGreaterThan(0);
    expect(['green', 'amber', 'red']).toContain(updated.alertLevel);
  });

  it('addCheckIn pushes check-in and recomputes burden', () => {
    const p = makePatient({ id: 'c1' });
    store.addPatient(p);
    const checkIn: CheckIn = {
      discomfort: 4,
      needsHelp: true,
      planningToLeave: false,
      timestamp: Date.now(),
    };
    store.addCheckIn('c1', checkIn);
    const updated = store.getSnapshot().find((x) => x.id === 'c1')!;
    expect(updated.checkIns).toHaveLength(1);
    expect(updated.checkIns[0].discomfort).toBe(4);
    expect(updated.missedCheckIn).toBe(false);
  });

  it('planningToLeave sets alert to red', () => {
    const p = makePatient({ id: 'd1', burdenIndex: 10 });
    store.addPatient(p);
    store.addCheckIn('d1', {
      discomfort: 1,
      needsHelp: false,
      planningToLeave: true,
      timestamp: Date.now(),
    });
    const updated = store.getSnapshot().find((x) => x.id === 'd1')!;
    expect(updated.alertLevel).toBe('red');
  });

  it('applyIntervention lowers burdenIndex', () => {
    const p = makePatient({ id: 'e1', burdenIndex: 50 });
    store.addPatient(p);
    store.applyIntervention('e1');
    const updated = store.getSnapshot().find((x) => x.id === 'e1')!;
    expect(updated.burdenIndex).toBe(35);
  });

  it('updateBurdenCurve and getBurdenCurve round-trip', () => {
    const curve = [
      { timeMinutes: 0, distressProbability: 0.1, lwbsProbability: 0.05, returnVisitRisk: 0.02 },
      { timeMinutes: 60, distressProbability: 0.4, lwbsProbability: 0.2, returnVisitRisk: 0.1 },
    ];
    store.addPatient(makePatient({ id: 'f1' }));
    store.updateBurdenCurve('f1', curve);
    expect(store.getBurdenCurve('f1')).toEqual(curve);
  });

  it('setAlertConfig changes thresholds', () => {
    const p = makePatient({ id: 'g1', burdenIndex: 50 });
    store.addPatient(p);
    store.updateBurden('g1');
    let updated = store.getSnapshot().find((x) => x.id === 'g1')!;
    expect(updated.alertLevel).toBe('amber');

    store.setAlertConfig({ amberThreshold: 60, redThreshold: 85 });
    store.updateBurden('g1');
    updated = store.getSnapshot().find((x) => x.id === 'g1')!;
    expect(updated.alertLevel).toBe('green');
  });

  it('getMissedCheckInPatientIds returns ids when last check-in is older than interval', () => {
    const oldTs = Date.now() - (CHECK_IN_INTERVAL_MS + 60 * 1000);
    const p = makePatient({ id: 'm1' });
    store.addPatient(p);
    store.addCheckIn('m1', {
      discomfort: 2,
      needsHelp: false,
      planningToLeave: false,
      timestamp: oldTs,
    });
    store.updateBurden('m1');
    const missed = store.getMissedCheckInPatientIds();
    expect(missed).toContain('m1');
  });

  it('seedDemoPatients adds patients and updates burden', () => {
    store.seedDemoPatients();
    const snap = store.getSnapshot();
    expect(snap.length).toBeGreaterThanOrEqual(3);
    snap.forEach((p) => {
      expect(p.burdenIndex).toBeGreaterThanOrEqual(0);
      expect(p.alertLevel).toBeDefined();
    });
  });

  it('advanceDemoTime increases effective time', () => {
    store.addPatient(makePatient({ id: 't1' }));
    const before = store.getCurrentTime();
    store.advanceDemoTime(15 * 60 * 1000);
    const after = store.getCurrentTime();
    expect(after).toBeGreaterThanOrEqual(before + 15 * 60 * 1000 - 100);
  });

  it('clearDemoTime resets time offset', () => {
    store.advanceDemoTime(5 * 60 * 1000);
    store.clearDemoTime();
    const offset = store.getCurrentTime() - Date.now();
    expect(Math.abs(offset)).toBeLessThan(1000);
  });
});
