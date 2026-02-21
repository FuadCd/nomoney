import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientStoreService } from '../../core/patient-store.service';
import { AuthService } from '../../core/auth/auth.service';
import { BurdenUpdaterService } from '../../core/burden-updater.service';
import { Patient, AccessibilityFlags } from '../../models/patient.model';
import { DashboardLayoutComponent, NavItem } from '../../components/layout/dashboard-layout.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';

const MEDIAN_PHYSICIAN_MINUTES = 87;

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [
    AsyncPipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent,
    SkeletonLoaderComponent,
  ],
  template: `
    <app-dashboard-layout
      [navItems]="navItems"
      [breadcrumbs]="['Dashboard', 'Staff']"
      [notificationCount]="criticalAlertsCount()"
      (onSignOut)="signOut()"
    >
      <div class="staff-dashboard max-width-container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>Staff Dashboard</h1>
          <p class="subtitle">Equity-adjusted waiting burden — who is silently deteriorating?</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon patients">
                  <mat-icon>people</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ (patients$ | async)?.length ?? 0 }}</div>
                  <div class="stat-label">Total Patients</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card critical">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon critical">
                  <mat-icon>warning</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ criticalAlertsCount() }}</div>
                  <div class="stat-label">Critical Alerts</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card warning">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon warning">
                  <mat-icon>error_outline</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ warningAlertsCount() }}</div>
                  <div class="stat-label">Warning Alerts</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon>schedule</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ averageWaitTime() }}m</div>
                  <div class="stat-label">Avg Wait Time</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Time Controls -->
        <mat-card class="controls-card">
          <mat-card-header>
            <mat-card-title>Time Controls</mat-card-title>
            <mat-card-subtitle>Use +15 min to see burden and alerts update dynamically</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="time-controls">
              <button
                mat-raised-button
                color="primary"
                (click)="add15Minutes()"
                matTooltip="Advance simulation time by 15 minutes"
              >
                <mat-icon>add</mat-icon>
                Add +15 min
              </button>
              <button
                mat-stroked-button
                (click)="resetTime()"
                matTooltip="Reset simulation time to current"
              >
                <mat-icon>refresh</mat-icon>
                Reset time
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Patient Queue -->
        <mat-card class="queue-card">
          <mat-card-header>
            <mat-card-title>Patient Queue</mat-card-title>
            <mat-card-subtitle>{{ (patients$ | async)?.length ?? 0 }} patients in queue</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (patients$ | async; as patients) {
              @if (patients.length === 0) {
                <div class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <p>No patients in queue</p>
                </div>
              } @else {
                <div class="patient-cards-grid">
                  @for (p of patients; track p.id) {
                    <mat-card
                      class="patient-card"
                      [class.critical]="p.alertLevel === 'red'"
                      [class.warning]="p.alertLevel === 'amber'"
                    >
                      <mat-card-header>
                        <div class="patient-header">
                          <div class="patient-id">
                            <mat-icon class="id-icon">badge</mat-icon>
                            <span class="id-text">{{ p.id }}</span>
                          </div>
                          <div class="patient-badges">
                            @if (p.missedCheckIn) {
                              <mat-chip class="missed-chip" color="warn">
                                <mat-icon matChipAvatar>schedule</mat-icon>
                                Missed Check-in
                              </mat-chip>
                            }
                            <mat-chip
                              [color]="getAlertColor(p.alertLevel)"
                              class="alert-chip"
                            >
                              {{ alertLabel(p.alertLevel).toUpperCase() }}
                            </mat-chip>
                          </div>
                        </div>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="patient-stats">
                          <div class="stat-row">
                            <span class="stat-label">
                              <mat-icon>schedule</mat-icon>
                              Waiting:
                            </span>
                            <span class="stat-value">{{ getMinutesWaited(p) }} min</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">
                              <mat-icon>trending_up</mat-icon>
                              Burden:
                            </span>
                            <span class="stat-value burden" [class]="'burden-' + p.alertLevel">
                              {{ p.burdenIndex | number:'1.0-0' }}
                            </span>
                          </div>
                        </div>

                        @if (getFlagItems(p.flags).length > 0) {
                          <div class="flags-section">
                            <div class="flags-label">Accessibility Flags:</div>
                            <div class="flags-list">
                              @for (item of getFlagItems(p.flags); track item.key) {
                                <mat-chip class="flag-chip">
                                  <span class="flag-icon">{{ item.icon }}</span>
                                  {{ item.label }}
                                </mat-chip>
                              }
                            </div>
                          </div>
                        }

                        @if (hasLwbsRisk(p)) {
                          <div class="risk-alert">
                            <mat-icon>warning</mat-icon>
                            <span>Disengagement risk elevated — Recommend proactive check-in</span>
                          </div>
                        }

                        <div class="suggested-action">
                          <mat-icon>lightbulb_outline</mat-icon>
                          <span>{{ getSuggestedActions(p) }}</span>
                        </div>
                      </mat-card-content>
                      <mat-card-actions>
                        <button
                          mat-stroked-button
                          color="primary"
                          (click)="recordCheckIn(p)"
                          matTooltip="Record patient check-in"
                        >
                          <mat-icon>check_circle</mat-icon>
                          Record Check-In
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              }
            } @else {
              <app-skeleton-loader type="card" [rows]="3"></app-skeleton-loader>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </app-dashboard-layout>
  `,
  styles: [`
    .staff-dashboard {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0 0 8px;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      border-left: 4px solid #1E3A5F;
    }

    .stat-card.critical {
      border-left-color: #d32f2f;
    }

    .stat-card.warning {
      border-left-color: #f57c00;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F6F9;

      mat-icon {
        color: #1E3A5F;
        font-size: 24px;
      }

      &.critical mat-icon {
        color: #d32f2f;
      }

      &.warning mat-icon {
        color: #f57c00;
      }
    }

    .stat-details {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1A1A2E;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .controls-card {
      margin-bottom: 24px;
    }

    .time-controls {
      display: flex;
      gap: 12px;
    }

    .queue-card {
      margin-bottom: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      p {
        font-size: 16px;
        margin: 0;
      }
    }

    .patient-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .patient-card {
      border-left: 4px solid #1E3A5F;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
      }

      &.critical {
        border-left-color: #d32f2f;
      }

      &.warning {
        border-left-color: #f57c00;
      }
    }

    .patient-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .patient-id {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: monospace;
      font-weight: 600;
      font-size: 16px;
      color: #1A1A2E;
    }

    .id-icon {
      color: #1E3A5F;
    }

    .patient-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .missed-chip {
      font-size: 11px;
    }

    .alert-chip {
      font-weight: 600;
      font-size: 11px;
    }

    .patient-stats {
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }

    .stat-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .stat-value {
      font-weight: 600;
      color: #1A1A2E;

      &.burden-red {
        color: #d32f2f;
      }

      &.burden-amber {
        color: #f57c00;
      }

      &.burden-green {
        color: #2e7d32;
      }
    }

    .flags-section {
      margin: 16px 0;
      padding-top: 16px;
      border-top: 1px solid #E0E0E0;
    }

    .flags-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .flags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .flag-chip {
      font-size: 11px;
      background: #E3F2FD;
      color: #0D47A1;
    }

    .flag-icon {
      margin-right: 4px;
    }

    .risk-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #FFEBEE;
      border-left: 3px solid #d32f2f;
      border-radius: 4px;
      font-size: 13px;
      color: #C62828;
      margin: 16px 0;

      mat-icon {
        color: #d32f2f;
      }
    }

    .suggested-action {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background: #F4F6F9;
      border-radius: 4px;
      font-size: 13px;
      color: #1A1A2E;
      margin-top: 16px;

      mat-icon {
        color: #1E3A5F;
        margin-top: 2px;
      }
    }

    @media (max-width: 768px) {
      .patient-cards-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class StaffComponent implements OnInit {
  private store = inject(PatientStoreService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private burdenUpdater = inject(BurdenUpdaterService);

  readonly MEDIAN_PHYSICIAN_MINUTES = MEDIAN_PHYSICIAN_MINUTES;
  patients$ = this.store.getPatients();
  
  criticalAlertsCount = signal(0);
  warningAlertsCount = signal(0);

  navItems: NavItem[] = [
    { label: 'Staff Dashboard', icon: 'dashboard', route: '/staff' },
    { label: 'Admin Dashboard', icon: 'admin_panel_settings', route: '/admin' },
  ];

  ngOnInit(): void {
    this.patients$.subscribe(patients => {
      this.criticalAlertsCount.set(patients.filter(p => p.alertLevel === 'red').length);
      this.warningAlertsCount.set(patients.filter(p => p.alertLevel === 'amber').length);
    });
  }

  getMinutesWaited(p: Patient): number {
    const now = this.store.getCurrentTime();
    return Math.round((now - p.waitStart) / 60_000);
  }

  alertLabel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  getAlertColor(level: string): 'primary' | 'warn' | 'accent' {
    if (level === 'red') return 'warn';
    if (level === 'amber') return 'accent';
    return 'primary';
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

  hasLwbsRisk(p: Patient): boolean {
    const intendsToStayFalse = p.checkIns.some((c) => c.planningToLeave);
    const minutesWaited = this.getMinutesWaited(p);
    const highBurden = p.burdenIndex >= 70;
    const pastTrigger = minutesWaited >= MEDIAN_PHYSICIAN_MINUTES;

    const credibleDisengagementRisk =
      !!p.missedCheckIn &&
      minutesWaited > MEDIAN_PHYSICIAN_MINUTES &&
      p.burdenIndex > 55;

    return (
      intendsToStayFalse ||
      highBurden ||
      pastTrigger ||
      credibleDisengagementRisk
    );
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

  add15Minutes(): void {
    this.store.advanceDemoTime(15 * 60 * 1000);
    this.burdenUpdater.refreshAll();
  }

  resetTime(): void {
    this.store.clearDemoTime();
    this.burdenUpdater.refreshAll();
  }

  recordCheckIn(p: Patient): void {
    // TODO: Implement check-in modal
    console.log('Record check-in for patient:', p.id);
  }

  signOut(): void {
    this.auth.clear();
    this.router.navigate(['/']);
  }
}
