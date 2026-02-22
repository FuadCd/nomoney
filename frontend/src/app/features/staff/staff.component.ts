import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { PatientStoreService } from '../../core/patient-store.service';
import { AuthService } from '../../core/auth/auth.service';
import { BurdenUpdaterService } from '../../core/burden-updater.service';
import { PatientsService } from '../../core/services/patients.service';
import { Patient, CheckIn, AccessibilityFlags } from '../../models/patient.model';

const MEDIAN_PHYSICIAN_MINUTES = 87;
const SYNC_INTERVAL_MS = 3000;

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe],
  template: `
    <div class="staff-page min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b shadow-sm">
        <div class="staff-header-inner">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                (click)="goBack()"
                class="staff-tap-target p-2 -ml-2 rounded hover:bg-gray-100"
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <div class="min-w-0">
                  @if (hospitalName()) {
                    <h1 class="staff-title text-lg sm:text-2xl font-bold text-gray-900 truncate">{{ hospitalName() }}</h1>
                  } @else {
                    <h1 class="staff-title text-lg sm:text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                  }
                  <p class="text-sm text-gray-600 mt-0.5">Staff Dashboard</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button
                type="button"
                (click)="goToAdmin()"
                class="staff-tap-target px-4 py-2.5 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-700 rounded-md"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="staff-main">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-600 mb-1">Total Patients</p>
            <p class="text-3xl font-bold">{{ (patients$ | async)?.length ?? 0 }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-600 mb-1">Red Alerts</p>
            <p class="text-3xl font-bold text-red-600">{{ criticalAlertsCount() }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-600 mb-1">Amber Alerts</p>
            <p class="text-3xl font-bold text-amber-600">{{ warningAlertsCount() }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-600 mb-1">Green</p>
            <p class="text-3xl font-bold text-green-600">{{ greenCount() }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-600 mb-1">Avg Wait Time</p>
            <p class="text-3xl font-bold">{{ averageWaitTime() }}m</p>
          </div>
        </div>

        <!-- Time Controls -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">Time Controls</h2>
          <p class="text-sm text-gray-600 mb-4">Use +30 min to see burden and alerts update dynamically</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              (click)="add30Minutes()"
              class="staff-btn staff-btn-primary"
            >
              Add +30 min
            </button>
            <button
              type="button"
              (click)="resetTime()"
              class="staff-btn staff-btn-secondary"
            >
              Reset time
            </button>
          </div>
        </div>

        <!-- Patient Queue -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Patient Queue
            </h2>
            <p class="text-sm text-gray-600 mt-1">{{ (patients$ | async)?.length ?? 0 }} patients in queue</p>
          </div>
          <div class="p-6">
            @if (patients$ | async; as patients) {
              @if (patients.length === 0) {
                <div class="text-center py-12 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                  <p>No patients in queue</p>
                  <p class="text-sm mt-1">Patients will appear here when they check in</p>
                </div>
              } @else {
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  @for (p of patients; track p.id) {
                    <div
                      class="rounded-lg border-2 p-4 transition-shadow hover:shadow-md"
                      [class.border-red-300]="p.alertLevel === 'red'"
                      [class.bg-red-50]="p.alertLevel === 'red'"
                      [class.border-amber-300]="p.alertLevel === 'amber'"
                      [class.bg-amber-50]="p.alertLevel === 'amber'"
                      [class.border-green-300]="p.alertLevel === 'green'"
                      [class.bg-white]="p.alertLevel === 'green'"
                    >
                      <div class="flex items-start justify-between mb-4">
                        <div>
                          <div class="font-mono font-bold text-lg text-gray-900">{{ p.id }}</div>
                          <div class="text-sm text-gray-600">{{ getMinutesWaited(p) }} min waited</div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                          <span
                            class="px-2 py-0.5 rounded text-xs font-semibold border"
                            [class.bg-red-100]="p.alertLevel === 'red'"
                            [class.text-red-800]="p.alertLevel === 'red'"
                            [class.border-red-300]="p.alertLevel === 'red'"
                            [class.bg-amber-100]="p.alertLevel === 'amber'"
                            [class.text-amber-800]="p.alertLevel === 'amber'"
                            [class.border-amber-300]="p.alertLevel === 'amber'"
                            [class.bg-green-100]="p.alertLevel === 'green'"
                            [class.text-green-800]="p.alertLevel === 'green'"
                            [class.border-green-300]="p.alertLevel === 'green'"
                          >
                            {{ alertLabel(p.alertLevel).toUpperCase() }}
                          </span>
                          @if (p.missedCheckIn) {
                            <span class="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                              Missed Check-in
                            </span>
                          }
                        </div>
                      </div>

                      <div class="mb-4">
                        <div class="flex justify-between text-sm mb-1">
                          <span class="font-medium">Burden Index</span>
                          <span class="font-bold">{{ p.burdenIndex | number:'1.0-0' }}/100</span>
                        </div>
                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all"
                            [style.width.%]="p.burdenIndex"
                            [class.bg-red-600]="p.burdenIndex >= 70"
                            [class.bg-amber-600]="p.burdenIndex >= 45 && p.burdenIndex < 70"
                            [class.bg-green-600]="p.burdenIndex < 45"
                          ></div>
                        </div>
                        @let lwbsPct = getLwbsRiskPercent(p);
                        @if (lwbsPct !== null) {
                          <p class="text-xs text-gray-600 mt-1.5">
                            Risk of leaving without being seen: {{ lwbsPct }}%
                            @if (lwbsPct >= 30) {
                              <span class="font-medium text-amber-700">(elevated)</span>
                            }
                          </p>
                        }
                      </div>

                      @if (getFlagItems(p.flags).length > 0) {
                        <div class="flex flex-wrap gap-2 mb-4">
                          @for (item of getFlagItems(p.flags); track item.key) {
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                              {{ item.icon }} {{ item.label }}
                            </span>
                          }
                        </div>
                      }

                      @if (getLatestCheckIn(p); as last) {
                        <div class="checkin-card mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                          <p class="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                            <span>📋</span> Latest check-in {{ formatCheckInTime(last.timestamp) }}
                          </p>
                          <div class="space-y-1.5 text-sm">
                            <p><span class="font-medium">Feeling:</span> {{ getDiscomfortLabel(last.discomfort) }} {{ getDiscomfortEmoji(last.discomfort) }}</p>
                            <p><span class="font-medium">Planning:</span> {{ getPlanningLabel(last) }}</p>
                            @if (last.assistanceRequested?.length) {
                              <p><span class="font-medium">Needs:</span> {{ getNeedsLabel(last.assistanceRequested ?? []) }}</p>
                            }
                          </div>
                        </div>
                      }

                      @if (hasLwbsRisk(p)) {
                        <div class="flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded-lg mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          <span class="text-xs font-medium text-red-800">Disengagement risk elevated — Recommend proactive check-in</span>
                        </div>
                      }

                      <div class="pt-3 border-t border-gray-200">
                        <p class="text-xs text-gray-600 mb-1">Suggested Action</p>
                        <p class="text-sm font-medium text-gray-900">{{ getSuggestedActions(p) }}</p>
                      </div>

                      <button
                        type="button"
                        (click)="sentToDoctor(p)"
                        class="staff-btn staff-btn-outline mt-4 w-full py-2.5 min-h-[44px] border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50"
                      >
                        Sent to Doctor — Off Queue
                      </button>
                    </div>
                  }
                </div>
              }
            } @else {
              <div class="text-center py-12 text-gray-500">Loading...</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .staff-page { padding-left: env(safe-area-inset-left, 0); padding-right: env(safe-area-inset-right, 0); padding-bottom: env(safe-area-inset-bottom, 0); }
      .staff-header-inner {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1rem 1rem 1rem calc(1rem + env(safe-area-inset-left, 0));
        padding-right: calc(1rem + env(safe-area-inset-right, 0));
        padding-top: calc(1rem + env(safe-area-inset-top, 0));
      }
      .staff-main {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1rem 1rem calc(1.5rem + env(safe-area-inset-bottom, 0));
        padding-left: calc(1rem + env(safe-area-inset-left, 0));
        padding-right: calc(1rem + env(safe-area-inset-right, 0));
      }
      @media (min-width: 640px) {
        .staff-header-inner, .staff-main { padding-left: 1.5rem; padding-right: 1.5rem; }
      }
      .staff-tap-target { min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; }
      .staff-btn { min-height: 44px; padding: 0.5rem 1rem; font-size: 1rem; border-radius: 0.375rem; cursor: pointer; transition: background 0.15s; }
      .staff-btn-primary { background: #2563eb; color: white; border: none; }
      .staff-btn-primary:hover { background: #1d4ed8; }
      .staff-btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
      .staff-btn-secondary:hover { background: #f9fafb; }
      .staff-btn-outline { }
    `,
  ],
})
export class StaffComponent implements OnInit, OnDestroy {
  private store = inject(PatientStoreService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private burdenUpdater = inject(BurdenUpdaterService);
  private patientsApi = inject(PatientsService);

  patients$ = this.store.getPatients();
  private syncSub: Subscription | null = null;

  criticalAlertsCount = signal(0);
  warningAlertsCount = signal(0);
  greenCount = signal(0);
  hospitalName = signal<string | null>(null);

  constructor() {
    this.hospitalName.set(this.auth.getStaffHospitalName());
  }

  ngOnInit(): void {
    this.patients$.subscribe(patients => {
      this.criticalAlertsCount.set(patients.filter(p => p.alertLevel === 'red').length);
      this.warningAlertsCount.set(patients.filter(p => p.alertLevel === 'amber').length);
      this.greenCount.set(patients.filter(p => p.alertLevel === 'green').length);
    });

    const hospitalKey = this.auth.getStaffHospitalKey();
    if (hospitalKey) {
      this.syncSub = interval(SYNC_INTERVAL_MS)
        .pipe(
          startWith(0),
          switchMap(() => this.patientsApi.getByHospital(hospitalKey)),
        )
        .subscribe({
          next: (patients) => {
            this.store.setPatientsFromBackend(patients);
            this.burdenUpdater.refreshAll();
          },
          error: () => {},
        });
    }
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
    this.syncSub = null;
  }

  goBack(): void {
    this.auth.clear();
    this.router.navigate(['/']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  getMinutesWaited(p: Patient): number {
    const now = this.store.getCurrentTime();
    return Math.round((now - p.waitStart) / 60_000);
  }

  alertLabel(level: string): string {
    const labels: Record<string, string> = { red: 'Urgent', amber: 'Monitor', green: 'OK' };
    return labels[level] ?? level;
  }

  averageWaitTime(): number {
    let patients: Patient[] = [];
    this.store.getPatients().subscribe(p => patients = p).unsubscribe();
    if (patients.length === 0) return 0;
    const total = patients.reduce((sum, p) => sum + this.getMinutesWaited(p), 0);
    return Math.round(total / patients.length);
  }

  private readonly flagConfig: { key: keyof AccessibilityFlags; label: string; icon: string }[] = [
    { key: 'mobility', label: 'Mobility', icon: '🦽' },
    { key: 'chronicPain', label: 'Pain', icon: '💊' },
    { key: 'sensory', label: 'Sensory', icon: '🔇' },
    { key: 'cognitive', label: 'Cognitive', icon: '🧠' },
    { key: 'alone', label: 'Alone', icon: '👤' },
    { key: 'language', label: 'Language', icon: '🌐' },
  ];

  getFlagItems(flags: AccessibilityFlags): { key: string; label: string; icon: string }[] {
    return this.flagConfig.filter((f) => flags[f.key]).map((f) => ({ key: f.key, label: f.label, icon: f.icon }));
  }

  getLatestCheckIn(p: Patient): CheckIn | undefined {
    return p.checkIns?.length ? p.checkIns[p.checkIns.length - 1] : undefined;
  }

  isNewCheckIn(timestamp: number): boolean {
    const now = this.store.getCurrentTime();
    return (now - timestamp) < 2 * 60 * 1000; // within 2 min
  }

  formatCheckInTime(timestamp: number): string {
    const now = this.store.getCurrentTime();
    const mins = Math.round((now - timestamp) / 60_000);
    if (mins < 1) return '(just now)';
    if (mins === 1) return '(1 min ago)';
    return `(${mins} min ago)`;
  }

  private readonly discomfortLabels: Record<number, string> = {
    1: 'Minimal',
    2: 'Mild',
    3: 'Moderate',
    4: 'High',
    5: 'Severe',
  };

  private readonly discomfortEmojis: Record<number, string> = {
    1: '🙂',
    2: '😕',
    3: '😣',
    4: '😫',
    5: '🆘',
  };

  getDiscomfortLabel(level: number): string {
    return this.discomfortLabels[level] ?? `Level ${level}`;
  }

  getDiscomfortEmoji(level: number): string {
    return this.discomfortEmojis[level] ?? '';
  }

  getPlanningLabel(c: CheckIn): string {
    const choice = c.planningToLeaveChoice ?? (c.planningToLeave ? 'leaving' : 'staying');
    if (choice === 'staying') return 'Staying';
    if (choice === 'unsure') return 'Unsure';
    return 'Thinking of leaving';
  }

  private readonly needLabels: Record<string, string> = {
    interpreter: 'Interpreter',
    'quiet-space': 'Quiet space',
    info: 'More info',
    mobility: 'Mobility help',
  };

  getNeedsLabel(keys: string[]): string {
    return keys.map((k) => this.needLabels[k] ?? k).join(', ');
  }

  /** LWBS risk at patient's current wait time (0–100), or null if no curve. */
  getLwbsRiskPercent(p: Patient): number | null {
    const curve = this.store.getBurdenCurve(p.id);
    if (!curve?.length) return null;
    const waitMin = this.getMinutesWaited(p);
    const point = curve.reduce((a, b) =>
      Math.abs(a.timeMinutes - waitMin) <= Math.abs(b.timeMinutes - waitMin) ? a : b,
    );
    return Math.round((point.lwbsProbability ?? 0) * 100);
  }

  hasLwbsRisk(p: Patient): boolean {
    const intendsToStayFalse = p.checkIns.some((c) => c.planningToLeave);
    const minutesWaited = this.getMinutesWaited(p);
    const highBurden = p.burdenIndex >= 70;
    const pastTrigger = minutesWaited >= MEDIAN_PHYSICIAN_MINUTES;
    const credibleDisengagementRisk =
      !!p.missedCheckIn &&
      minutesWaited > MEDIAN_PHYSICIAN_MINUTES &&
      p.burdenIndex > 55;
    return intendsToStayFalse || highBurden || pastTrigger || credibleDisengagementRisk;
  }

  getSuggestedActions(p: Patient): string {
    const minutesWaited = this.getMinutesWaited(p);
    const planningToLeave = p.checkIns.some((c) => c.planningToLeave);
    const highBurden = p.burdenIndex >= 70;
    const pastTrigger = minutesWaited >= MEDIAN_PHYSICIAN_MINUTES;
    const credibleDisengagementRisk =
      !!p.missedCheckIn &&
      minutesWaited > MEDIAN_PHYSICIAN_MINUTES &&
      p.burdenIndex > 55;

    if (credibleDisengagementRisk) {
      return 'Immediate staff outreach — credible disengagement risk (missed check-in + extended wait + elevated burden)';
    }
    if (minutesWaited < 87 && !planningToLeave) {
      return 'Accessibility check (optional)';
    }

    const actions: string[] = [];
    if (p.flags.mobility) actions.push('Provide seating support');
    if (p.flags.sensory) actions.push('Offer quieter space');
    if (p.flags.alone) actions.push('Support staff check-in');
    if (p.flags.chronicPain) actions.push('Check comfort while waiting');
    if (p.flags.cognitive) actions.push('Use simplified communication');
    if (p.flags.language) actions.push('Offer translation if needed');
    if (highBurden || pastTrigger) actions.push('Proactive accessibility check');
    if (planningToLeave) actions.push('Confirm patient intends to stay');
    if (actions.length === 0) actions.push('Routine check-in recommended');

    return actions.join(' • ');
  }

  add30Minutes(): void {
    this.store.advanceDemoTime(30 * 60 * 1000);
    this.burdenUpdater.refreshAll();
  }

  resetTime(): void {
    this.store.clearDemoTime();
    this.burdenUpdater.refreshAll();
  }

  sentToDoctor(p: Patient): void {
    this.patientsApi.remove(p.id).subscribe({
      next: (res) => {
        if (res.ok) this.store.removePatient(p.id);
      },
      error: () => {},
    });
  }
}
