import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { AdminSummaryService, type AdminSummary, type EquityFlagKey } from '../../core/services/admin-summary.service';
import {
  MEDIAN_TOTAL_STAY_MINUTES,
  MEDIAN_TO_PHYSICIAN_MINUTES,
  MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES,
} from '../../../lib/model/modelConstants';
import { DashboardLayoutComponent, NavItem } from '../../components/layout/dashboard-layout.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';

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
  imports: [
    AsyncPipe,
    DecimalPipe,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    DashboardLayoutComponent,
    SkeletonLoaderComponent,
  ],
  template: `
    <app-dashboard-layout
      [navItems]="navItems"
      [breadcrumbs]="['Dashboard', 'Admin']"
      [notificationCount]="0"
      (onSignOut)="signOut()"
    >
      <div class="admin-dashboard max-width-container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div>
              <h1>Admin Dashboard</h1>
              <p class="subtitle">Read-only — Model health & equity overview</p>
            </div>
            <mat-chip class="read-only-chip" color="accent">
              <mat-icon matChipAvatar>lock</mat-icon>
              Read-Only Mode
            </mat-chip>
          </div>
        </div>

        @if (summary$ | async; as s) {
          <!-- Model Health Section -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>analytics</mat-icon>
                Model Health
              </mat-card-title>
              <mat-card-subtitle>Real-time metrics and alert distribution</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="model-health-grid">
                <!-- Alert Distribution -->
                <div class="alert-distribution">
                  <h3>Alert Distribution</h3>
                  <div class="alert-bars">
                    <div class="alert-bar-item">
                      <div class="bar-header">
                        <span class="bar-label">Green</span>
                        <span class="bar-value">{{ s.alertDistribution.greenPercent | number:'1.0-1' }}%</span>
                      </div>
                      <mat-progress-bar
                        mode="determinate"
                        [value]="s.alertDistribution.greenPercent"
                        color="primary"
                        class="progress-bar"
                      ></mat-progress-bar>
                      <div class="bar-count">{{ s.alertDistribution.green }} patients</div>
                    </div>
                    <div class="alert-bar-item">
                      <div class="bar-header">
                        <span class="bar-label">Amber</span>
                        <span class="bar-value">{{ s.alertDistribution.amberPercent | number:'1.0-1' }}%</span>
                      </div>
                      <mat-progress-bar
                        mode="determinate"
                        [value]="s.alertDistribution.amberPercent"
                        color="accent"
                        class="progress-bar"
                      ></mat-progress-bar>
                      <div class="bar-count">{{ s.alertDistribution.amber }} patients</div>
                    </div>
                    <div class="alert-bar-item">
                      <div class="bar-header">
                        <span class="bar-label">Red</span>
                        <span class="bar-value">{{ s.alertDistribution.redPercent | number:'1.0-1' }}%</span>
                      </div>
                      <mat-progress-bar
                        mode="determinate"
                        [value]="s.alertDistribution.redPercent"
                        color="warn"
                        class="progress-bar"
                      ></mat-progress-bar>
                      <div class="bar-count">{{ s.alertDistribution.red }} patients</div>
                    </div>
                  </div>
                </div>

                <!-- Average Burden -->
                <mat-card class="stat-card" [class.normal]="s.avgBurden >= 30 && s.avgBurden <= 55" [class.strain]="s.avgBurden >= 70">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon">
                        <mat-icon>trending_up</mat-icon>
                      </div>
                      <div class="stat-details">
                        <div class="stat-value">{{ s.avgBurden | number:'1.0-1' }}</div>
                        <div class="stat-label">Average Burden</div>
                        <div class="stat-hint">30–55 normal · 70+ sustained strain</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Missed Check-In Rate -->
                <mat-card class="stat-card warning">
                  <mat-card-content>
                    <div class="stat-content">
                      <div class="stat-icon warning">
                        <mat-icon>schedule</mat-icon>
                      </div>
                      <div class="stat-details">
                        <div class="stat-value">{{ s.missedCheckInRate | number:'1.0-1' }}%</div>
                        <div class="stat-label">Missed Check-In Rate</div>
                        <div class="stat-hint">Engagement health</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Equity Overview Section -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>balance</mat-icon>
                Equity Overview
              </mat-card-title>
              <mat-card-subtitle>Average burden and % RED by accessibility flag</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="equity-grid">
                <!-- Average Burden by Flag -->
                <div class="equity-chart">
                  <h3>Average Burden by Flag</h3>
                  <div class="equity-bars">
                    @for (key of equityKeys; track key) {
                      <div class="equity-bar-item">
                        <div class="bar-header">
                          <span class="bar-label">{{ EQUITY_LABELS[key] }}</span>
                          <span class="bar-value">{{ s.avgBurdenByFlag[key] | number:'1.0-1' }}</span>
                        </div>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="s.avgBurdenByFlag[key]"
                          class="progress-bar neutral"
                        ></mat-progress-bar>
                      </div>
                    }
                  </div>
                </div>

                <!-- % Red by Flag -->
                <div class="equity-chart">
                  <h3>% Red by Flag</h3>
                  <div class="equity-bars">
                    @for (key of equityKeys; track key) {
                      <div class="equity-bar-item">
                        <div class="bar-header">
                          <span class="bar-label">{{ EQUITY_LABELS[key] }}</span>
                          <span class="bar-value">{{ s.redRateByFlag[key] | number:'1.0-1' }}%</span>
                        </div>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="s.redRateByFlag[key]"
                          color="warn"
                          class="progress-bar"
                        ></mat-progress-bar>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Model Anchors Section -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>book</mat-icon>
                Model Anchors & Sources
              </mat-card-title>
              <mat-card-subtitle>Reference values from research studies</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="anchors-grid">
                <div class="anchor-item">
                  <mat-icon class="anchor-icon">science</mat-icon>
                  <div class="anchor-content">
                    <h4>CIHI Medians</h4>
                    <ul>
                      <li>Total stay: <strong>{{ MEDIAN_TOTAL_STAY_MINUTES }} min</strong></li>
                      <li>Time to physician: <strong>{{ MEDIAN_TO_PHYSICIAN_MINUTES }} min</strong></li>
                    </ul>
                  </div>
                </div>
                <div class="anchor-item">
                  <mat-icon class="anchor-icon">school</mat-icon>
                  <div class="anchor-content">
                    <h4>McMaster Study</h4>
                    <ul>
                      <li>Early risk threshold: <strong>{{ MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES }} min</strong></li>
                    </ul>
                  </div>
                </div>
                <div class="anchor-item">
                  <mat-icon class="anchor-icon">local_hospital</mat-icon>
                  <div class="anchor-content">
                    <h4>LWBS Source</h4>
                    <ul>
                      <li>Health Quality Council of Alberta (HQCA)</li>
                    </ul>
                  </div>
                </div>
                <div class="anchor-item">
                  <mat-icon class="anchor-icon">bar_chart</mat-icon>
                  <div class="anchor-content">
                    <h4>Weights Source</h4>
                    <ul>
                      <li>Statistics Canada – Disability in Canada (2024)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="safety-notice">
                <mat-icon>security</mat-icon>
                <div>
                  <strong>Safety:</strong> Admin cannot change thresholds, weights, patients, LWBS scaling, or triage.
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        } @else {
          <app-skeleton-loader type="card" [rows]="3"></app-skeleton-loader>
        }
      </div>
    </app-dashboard-layout>
  `,
  styles: [`
    .admin-dashboard {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
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

    .read-only-chip {
      font-weight: 500;
    }

    .section-card {
      margin-bottom: 24px;
    }

    .section-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .section-card mat-icon {
      color: #1E3A5F;
    }

    .model-health-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 24px;
      margin-top: 16px;
    }

    @media (max-width: 1024px) {
      .model-health-grid {
        grid-template-columns: 1fr;
      }
    }

    .alert-distribution {
      flex: 1;
    }

    .alert-distribution h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0 0 16px;
    }

    .alert-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alert-bar-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bar-label {
      font-size: 14px;
      font-weight: 500;
      color: #1A1A2E;
    }

    .bar-value {
      font-size: 14px;
      font-weight: 600;
      color: #1A1A2E;
    }

    .progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .progress-bar.neutral {
      ::ng-deep .mdc-linear-progress__buffer {
        background-color: #E0E0E0;
      }
      ::ng-deep .mdc-linear-progress__bar-inner {
        background-color: #1E3A5F;
      }
    }

    .bar-count {
      font-size: 12px;
      color: #666;
    }

    .stat-card {
      border-left: 4px solid #1E3A5F;
    }

    .stat-card.normal {
      border-left-color: #2e7d32;
    }

    .stat-card.strain {
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
      margin-bottom: 4px;
    }

    .stat-hint {
      font-size: 12px;
      color: #999;
    }

    .equity-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .equity-grid {
        grid-template-columns: 1fr;
      }
    }

    .equity-chart h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0 0 16px;
    }

    .equity-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .equity-bar-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .anchors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .anchor-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #F4F6F9;
      border-radius: 8px;
      border-left: 3px solid #1E3A5F;
    }

    .anchor-icon {
      color: #1E3A5F;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .anchor-content h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0 0 8px;
    }

    .anchor-content ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #666;
    }

    .anchor-content li {
      margin-bottom: 4px;
    }

    .safety-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #FFF3E0;
      border-left: 4px solid #f57c00;
      border-radius: 4px;
      margin-top: 24px;
      font-size: 13px;
      color: #E65100;

      mat-icon {
        color: #f57c00;
      }
    }
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

  navItems: NavItem[] = [
    { label: 'Staff Dashboard', icon: 'dashboard', route: '/staff' },
    { label: 'Admin Dashboard', icon: 'admin_panel_settings', route: '/admin' },
  ];

  signOut(): void {
    this.auth.clear();
    this.router.navigate(['/']);
  }
}
