import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AdminSummaryService, type AdminSummary, type EquityFlagKey } from '../../core/services/admin-summary.service';
import {
  MEDIAN_TOTAL_STAY_MINUTES,
  MEDIAN_TO_PHYSICIAN_MINUTES,
  MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES,
} from '../../../lib/model/modelConstants';

const EQUITY_LABELS: Record<EquityFlagKey, string> = {
  mobility: 'Mobility',
  chronicPain: 'Chronic pain',
  sensory: 'Sensory',
  cognitive: 'Cognitive',
  language: 'Language',
  alone: 'Alone',
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <div class="admin-layout">
      <header class="header">
        <h1>AccessER Admin Dashboard</h1>
        <p class="subtitle">Read-only — Model health & equity overview</p>
      </header>

      <main class="content">
        @if (summary$ | async; as s) {
          <!-- Card 1: Model Health -->
          <section class="card" aria-label="Model health">
            <h2>Model Health</h2>
            <div class="model-health-grid">
              <div class="alert-distribution">
                <h3>Alert distribution</h3>
                <div class="alert-bars">
                  <div class="bar-row">
                    <span class="bar-label">Green</span>
                    <div class="bar-track"><div class="bar-fill green" [style.width.%]="s.alertDistribution.greenPercent"></div></div>
                    <span class="bar-value">{{ s.alertDistribution.greenPercent }}%</span>
                  </div>
                  <div class="bar-row">
                    <span class="bar-label">Amber</span>
                    <div class="bar-track"><div class="bar-fill amber" [style.width.%]="s.alertDistribution.amberPercent"></div></div>
                    <span class="bar-value">{{ s.alertDistribution.amberPercent }}%</span>
                  </div>
                  <div class="bar-row">
                    <span class="bar-label">Red</span>
                    <div class="bar-track"><div class="bar-fill red" [style.width.%]="s.alertDistribution.redPercent"></div></div>
                    <span class="bar-value">{{ s.alertDistribution.redPercent }}%</span>
                  </div>
                </div>
              </div>
              <div class="avg-burden-cell">
                <h3>Average burden</h3>
                <div class="big-number" [class.normal]="s.avgBurden >= 30 && s.avgBurden <= 55" [class.strain]="s.avgBurden >= 70">
                  {{ s.avgBurden }}
                </div>
                <p class="hint">30–55 normal · 70+ sustained strain</p>
              </div>
              <div class="missed-cell">
                <h3>Missed check-in rate</h3>
                <span class="badge missed-badge">{{ s.missedCheckInRate }}%</span>
                <p class="hint">Engagement health</p>
              </div>
            </div>
          </section>

          <!-- Card 2: Equity Overview -->
          <section class="card" aria-label="Equity overview">
            <h2>Equity Overview</h2>
            <div class="equity-grid">
              <div class="chart-block">
                <h3>Average burden by flag</h3>
                <div class="flag-bars">
                  @for (key of equityKeys; track key) {
                    <div class="bar-row">
                      <span class="bar-label">{{ EQUITY_LABELS[key] }}</span>
                      <div class="bar-track"><div class="bar-fill neutral" [style.width.%]="s.avgBurdenByFlag[key]"></div></div>
                      <span class="bar-value">{{ s.avgBurdenByFlag[key] }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="chart-block">
                <h3>% Red by flag</h3>
                <div class="flag-bars">
                  @for (key of equityKeys; track key) {
                    <div class="bar-row">
                      <span class="bar-label">{{ EQUITY_LABELS[key] }}</span>
                      <div class="bar-track"><div class="bar-fill red" [style.width.%]="s.redRateByFlag[key]"></div></div>
                      <span class="bar-value">{{ s.redRateByFlag[key] }}%</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </section>

          <!-- Footer: Model anchors & sources -->
          <footer class="footer">
            <h3>Model anchors &amp; sources</h3>
            <ul>
              <li>CIHI median total stay: {{ MEDIAN_TOTAL_STAY_MINUTES }} min</li>
              <li>CIHI median to physician: {{ MEDIAN_TO_PHYSICIAN_MINUTES }} min</li>
              <li>McMaster early risk threshold: {{ MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES }} min</li>
              <li>LWBS rates source: HQCA</li>
              <li>Vulnerability weights source: Statistics Canada</li>
            </ul>
          </footer>
        } @else {
          <p class="empty">No data. Add patients from Staff dashboard.</p>
        }
      </main>

      <nav class="nav">
        <a routerLink="/staff">Staff</a>
        <a routerLink="/admin" routerLinkActive="active">Admin</a>
        <button type="button" class="nav-signout" (click)="signOut()">Sign out</button>
      </nav>
    </div>
  `,
  styles: [`
    .admin-layout { min-height: 100vh; display: flex; flex-direction: column; background: #fff; }
    .header { padding: 1.5rem; background: #4a148c; color: white; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0; opacity: 0.9; font-size: 0.9rem; }
    .content { flex: 1; padding: 1.5rem; max-width: 900px; margin: 0 auto; width: 100%; }
    .card { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { margin: 0 0 1rem; font-size: 1.1rem; color: #333; }
    .card h3 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #555; }
    .model-health-grid { display: grid; grid-template-columns: 1fr auto auto; gap: 1.5rem; align-items: start; }
    @media (max-width: 600px) { .model-health-grid { grid-template-columns: 1fr; } }
    .alert-bars .bar-row { margin-bottom: 0.5rem; }
    .bar-row { display: flex; align-items: center; gap: 0.5rem; }
    .bar-label { min-width: 5rem; font-size: 0.9rem; }
    .bar-track { flex: 1; height: 1.25rem; background: #eee; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; min-width: 0; transition: width 0.2s; }
    .bar-fill.green { background: #2e7d32; }
    .bar-fill.amber { background: #ff9800; }
    .bar-fill.red { background: #c62828; }
    .bar-fill.neutral { background: #5c6bc0; }
    .bar-value { font-size: 0.9rem; font-weight: 600; min-width: 2.5rem; }
    .avg-burden-cell .big-number { font-size: 2.5rem; font-weight: 700; }
    .avg-burden-cell .big-number.normal { color: #2e7d32; }
    .avg-burden-cell .big-number.strain { color: #c62828; }
    .hint { font-size: 0.8rem; color: #888; margin: 0.25rem 0 0; }
    .badge.missed-badge { font-size: 1rem; padding: 0.35rem 0.75rem; background: #ff9800; color: #fff; border-radius: 6px; font-weight: 600; }
    .equity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 700px) { .equity-grid { grid-template-columns: 1fr; } }
    .chart-block .flag-bars .bar-row { margin-bottom: 0.5rem; }
    .footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; font-size: 0.9rem; color: #666; }
    .footer h3 { margin: 0 0 0.5rem; font-size: 0.95rem; }
    .footer ul { margin: 0; padding-left: 1.25rem; }
    .footer li { margin-bottom: 0.25rem; }
    .empty { color: #888; padding: 1rem; }
    .nav { display: flex; gap: 1rem; padding: 1rem; background: #f5f5f5; }
    .nav a { color: #6a1b9a; text-decoration: none; }
    .nav a.active { font-weight: 600; }
    .nav-signout { margin-left: auto; padding: 0.35rem 0.6rem; background: transparent; border: 1px solid #6a1b9a; color: #6a1b9a; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
    .nav-signout:hover { background: #6a1b9a; color: white; }
  `],
})
export class AdminComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private adminSummary = inject(AdminSummaryService);

  readonly summary$ = this.adminSummary.getSummary$();
  readonly EQUITY_LABELS = EQUITY_LABELS;
  readonly equityKeys: EquityFlagKey[] = ['mobility', 'chronicPain', 'sensory', 'cognitive', 'language', 'alone'];
  readonly MEDIAN_TOTAL_STAY_MINUTES = MEDIAN_TOTAL_STAY_MINUTES;
  readonly MEDIAN_TO_PHYSICIAN_MINUTES = MEDIAN_TO_PHYSICIAN_MINUTES;
  readonly MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES = MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES;

  signOut(): void {
    this.auth.clear();
    this.router.navigate(['/']);
  }
}
