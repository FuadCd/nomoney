import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { PatientStoreService } from '../../core/patient-store.service';
import { AuthService } from '../../core/auth/auth.service';
import { BurdenUpdaterService } from '../../core/burden-updater.service';
import { Patient, AccessibilityFlags } from '../../models/patient.model';

const MEDIAN_PHYSICIAN_MINUTES = 87;

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, DecimalPipe],
  template: `
    <div class="staff-layout">
      <header class="header">
        <h1>AccessER Staff Dashboard</h1>
        <p class="subtitle">Equity-adjusted waiting burden — who is silently deteriorating?</p>
      </header>
      <main class="content">
        <section class="time-controls" aria-label="Simulation time controls">
          <h2>Time controls</h2>
          <p class="time-hint">Use +15 min to see burden and alerts update dynamically.</p>
          <div class="time-buttons">
            <button type="button" class="time-btn" (click)="add15Minutes()">Add +15 min</button>
            <button type="button" class="time-btn" (click)="resetTime()">Reset time</button>
          </div>
        </section>

        <section class="queue" aria-label="Patient queue">
          <h2>Queue ({{ (patients$ | async)?.length ?? 0 }} patients)</h2>
          <ul class="patient-list">
            @for (p of (patients$ | async); track p.id) {
              <li class="patient-card" [class.missed]="p.missedCheckIn" [attr.data-alert]="p.alertLevel">
                <div class="card-header">
                  <span class="id">{{ p.id }}</span>
                  @if (p.missedCheckIn) {
                    <span class="badge missed-badge">Missed check-in</span>
                  }
                </div>
                <div class="card-row">
                  <span class="label">Waiting:</span>
                  <span class="value">{{ getMinutesWaited(p) }} min</span>
                </div>
                <div class="card-row burden-row">
                  <span class="label">Burden:</span>
                  <span class="value burden-value" [attr.data-alert]="p.alertLevel">
                    {{ p.burdenIndex | number:'1.0-0' }} ({{ alertLabel(p.alertLevel) }})
                  </span>
                </div>
                <div class="card-row flags-row">
                  <span class="label">Flags:</span>
                  <span class="flags">
                    @for (item of getFlagItems(p.flags); track item.key) {
                      <span class="flag" [attr.title]="item.label">{{ item.icon }} {{ item.label }}</span>
                    }
                    @empty {
                      <span class="no-flags">None</span>
                    }
                  </span>
                </div>
                @if (hasLwbsRisk(p)) {
                  <div class="card-row risk-row">
                    <span class="lwbs-risk">⚠️ Disengagement risk elevated — Recommend proactive check-in</span>
                  </div>
                }
                <div class="card-row action-row">
                  <span class="label">Suggested action:</span>
                  <span class="actions">{{ getSuggestedActions(p) }}</span>
                </div>
              </li>
            } @empty {
              <li class="empty">No patients in queue.</li>
            }
          </ul>
        </section>
      </main>
      <nav class="nav">
        <a routerLink="/staff" routerLinkActive="active">Staff</a>
        <a routerLink="/admin">Admin</a>
        <button type="button" class="nav-signout" (click)="signOut()">Sign out</button>
      </nav>
    </div>
  `,
  styles: [`
    .staff-layout { min-height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 1.5rem; background: #1b5e20; color: white; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0; opacity: 0.9; font-size: 0.9rem; }
    .content { flex: 1; padding: 1.5rem; }
    .time-controls { margin-bottom: 1.5rem; }
    .time-controls h2 { font-size: 1rem; margin: 0 0 0.25rem; }
    .time-hint { font-size: 0.85rem; color: #666; margin: 0 0 0.5rem; }
    .time-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .time-btn { padding: 0.5rem 1rem; font-size: 0.9rem; background: #1b5e20; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .time-btn:hover { background: #2e7d32; }
    .queue h2 { font-size: 1.1rem; margin: 0 0 0.75rem; }
    .patient-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
    .patient-card { background: #fff; border: 2px solid #e0e0e0; border-radius: 12px; padding: 1rem 1.25rem; }
    .patient-card[data-alert="amber"] { border-color: #ff9800; background: #fff8e1; }
    .patient-card[data-alert="red"] { border-color: #c62828; background: #ffebee; }
    .patient-card.missed { background: #fff3e0; }
    .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .card-header .id { font-family: monospace; font-weight: 700; font-size: 1.1rem; }
    .badge.missed-badge { font-size: 0.75rem; background: #ff9800; color: #fff; padding: 0.15rem 0.5rem; border-radius: 4px; }
    .card-row { font-size: 0.95rem; margin-bottom: 0.35rem; }
    .card-row .label { color: #555; margin-right: 0.35rem; }
    .burden-value[data-alert="red"] { color: #c62828; font-weight: 700; }
    .burden-value[data-alert="amber"] { color: #ef6c00; font-weight: 600; }
    .burden-value[data-alert="green"] { color: #2e7d32; }
    .flags-row .flags { display: inline-flex; flex-wrap: wrap; gap: 0.35rem; }
    .flag { font-size: 0.85rem; background: #e3f2fd; color: #0d47a1; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .no-flags { color: #888; font-style: italic; }
    .risk-row { margin-top: 0.5rem; }
    .lwbs-risk { font-size: 0.9rem; font-weight: 600; color: #b71c1c; }
    .action-row { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee; }
    .action-row .actions { font-weight: 500; color: #1b5e20; }
    .empty { color: #888; font-style: italic; padding: 1rem; }
    .nav { display: flex; gap: 1rem; padding: 1rem; background: #f5f5f5; }
    .nav a { color: #2e7d32; text-decoration: none; }
    .nav a.active { font-weight: 600; }
    .nav-signout { margin-left: auto; padding: 0.35rem 0.6rem; background: transparent; border: 1px solid #2e7d32; color: #2e7d32; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
    .nav-signout:hover { background: #2e7d32; color: white; }
  `],
})
export class StaffComponent implements OnInit {
  private store = inject(PatientStoreService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private burdenUpdater = inject(BurdenUpdaterService);

  readonly MEDIAN_PHYSICIAN_MINUTES = MEDIAN_PHYSICIAN_MINUTES;
  patients$ = this.store.getPatients();

  ngOnInit(): void {}

  getMinutesWaited(p: Patient): number {
    const now = this.store.getCurrentTime();
    return Math.round((now - p.waitStart) / 60_000);
  }

  alertLabel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
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

    // Credible risk pattern: missed check-in + past early-risk window + elevated burden
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

  signOut(): void {
    this.auth.clear();
    this.router.navigate(['/']);
  }
}
