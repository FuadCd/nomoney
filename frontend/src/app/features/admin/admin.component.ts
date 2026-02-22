import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { AdminSummaryService, type AdminSummary, type EquityFlagKey } from '../../core/services/admin-summary.service';
import { PatientsService } from '../../core/services/patients.service';
import { PatientStoreService } from '../../core/patient-store.service';

const EQUITY_LABELS: Record<EquityFlagKey, string> = {
  mobility: 'Mobility',
  chronicPain: 'Chronic Pain',
  sensory: 'Sensory',
  cognitive: 'Cognitive',
  language: 'Language',
  alone: 'Alone',
};
const ADMIN_POLL_MS = 3000;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="admin-page min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="admin-header">
        <div class="admin-header-inner">
          <div class="admin-header-content">
            <div class="admin-header-left">
              <button
                type="button"
                (click)="goBack()"
                class="admin-tap-target admin-back-button"
                aria-label="Back to Staff"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
              <div class="admin-header-title-group">
                <svg xmlns="http://www.w3.org/2000/svg" class="admin-header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <div class="admin-header-text">
                  <h1 class="admin-title">Admin Dashboard</h1>
                  <p class="admin-subtitle">Model Health & Equity Overview</p>
                </div>
              </div>
            </div>
            <span class="admin-badge">
              Read-only
            </span>
          </div>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="admin-main">
        <div class="admin-content-grid">
          @if (summary$ | async; as s) {
            <!-- Hero Metrics Section -->
            <section class="admin-hero-section">
              <div class="admin-hero-grid">
                <!-- Average Burden Card -->
                <div class="admin-metric-card admin-metric-card-primary">
                  <div class="admin-metric-card-header">
                    <h3 class="admin-metric-card-title">Average Burden Index</h3>
                  </div>
                  <div class="admin-metric-card-content">
                    <div class="admin-metric-value-large">{{ s.avgBurden }}</div>
                    <div class="admin-metric-label">out of 100</div>
                    <div class="admin-metric-status">
                      {{ s.avgBurden < 45 ? 'System performing well' : s.avgBurden < 70 ? 'Moderate load' : 'High system burden' }}
                    </div>
                  </div>
                </div>

                <!-- Missed Check-in Rate Card -->
                <div class="admin-metric-card admin-metric-card-secondary">
                  <div class="admin-metric-card-header">
                    <h3 class="admin-metric-card-title">Missed Check-in Rate</h3>
                  </div>
                  <div class="admin-metric-card-content">
                    <div class="admin-metric-value-large">{{ s.missedCheckInRate }}%</div>
                    <div class="admin-metric-label">of patients</div>
                    @if (s.missedCheckInRate > 20) {
                      <div class="admin-metric-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" class="admin-metric-warning-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        <span>Above threshold</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Total Patients Card -->
                <div class="admin-metric-card admin-metric-card-tertiary">
                  <div class="admin-metric-card-header">
                    <h3 class="admin-metric-card-title">Total Patients</h3>
                  </div>
                  <div class="admin-metric-card-content">
                    <div class="admin-metric-value-large">{{ s.totalPatients }}</div>
                    <div class="admin-metric-label">Active monitoring</div>
                  </div>
                </div>

                <!-- High LWBS Risk Card -->
                <div class="admin-metric-card admin-metric-card-lwbs">
                  <div class="admin-metric-card-header">
                    <h3 class="admin-metric-card-title">High LWBS Risk</h3>
                  </div>
                  <div class="admin-metric-card-content">
                    <div class="admin-metric-value-large">{{ s.highLwbsRiskCount }}</div>
                    <div class="admin-metric-label">of {{ s.totalPatients }} patients ({{ s.highLwbsRiskPercent }}%)</div>
                    <div class="admin-metric-status">
                      Avg LWBS risk: {{ s.avgLwbsRisk }}%
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Model Health Section -->
            <section class="admin-section">
              <div class="admin-card">
                <div class="admin-card-header">
                  <div class="admin-card-header-content">
                    <svg xmlns="http://www.w3.org/2000/svg" class="admin-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <div>
                      <h2 class="admin-card-title">Model Health</h2>
                      <p class="admin-card-description">Overall system performance and alert distribution</p>
                    </div>
                  </div>
                </div>
                <div class="admin-card-body">
                  <div class="admin-health-grid">
                    <!-- Alert Distribution -->
                    <div class="admin-alert-section">
                      <h3 class="admin-section-subtitle">Alert Distribution</h3>
                      <div class="admin-alert-list">
                        <div class="admin-alert-item">
                          <div class="admin-alert-item-header">
                            <div class="admin-alert-item-label">
                              <span class="admin-alert-dot admin-alert-dot-green"></span>
                              <span class="admin-alert-text">Green (OK)</span>
                            </div>
                            <span class="admin-alert-count">{{ s.alertDistribution.green }}</span>
                          </div>
                          <div class="admin-progress-bar">
                            <div class="admin-progress-fill admin-progress-fill-green" [style.width.%]="s.alertDistribution.greenPercent"></div>
                          </div>
                        </div>

                        <div class="admin-alert-item">
                          <div class="admin-alert-item-header">
                            <div class="admin-alert-item-label">
                              <span class="admin-alert-dot admin-alert-dot-amber"></span>
                              <span class="admin-alert-text">Amber (Warning)</span>
                            </div>
                            <span class="admin-alert-count">{{ s.alertDistribution.amber }}</span>
                          </div>
                          <div class="admin-progress-bar">
                            <div class="admin-progress-fill admin-progress-fill-amber" [style.width.%]="s.alertDistribution.amberPercent"></div>
                          </div>
                        </div>

                        <div class="admin-alert-item">
                          <div class="admin-alert-item-header">
                            <div class="admin-alert-item-label">
                              <span class="admin-alert-dot admin-alert-dot-red"></span>
                              <span class="admin-alert-text">Red (Urgent)</span>
                            </div>
                            <span class="admin-alert-count">{{ s.alertDistribution.red }}</span>
                          </div>
                          <div class="admin-progress-bar">
                            <div class="admin-progress-fill admin-progress-fill-red" [style.width.%]="s.alertDistribution.redPercent"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Summary Stats -->
                    <div class="admin-summary-section">
                      <h3 class="admin-section-subtitle">System Summary</h3>
                      <div class="admin-summary-stats">
                        <div class="admin-summary-stat">
                          <div class="admin-summary-stat-header">
                            <span class="admin-summary-stat-label">Total Alerts</span>
                            <span class="admin-summary-stat-badge">{{ s.alertDistribution.green + s.alertDistribution.amber + s.alertDistribution.red }}</span>
                          </div>
                          <div class="admin-summary-legend">
                            <div class="admin-summary-legend-item">
                              <span class="admin-summary-legend-dot admin-summary-legend-dot-green"></span>
                              <span class="admin-summary-legend-text">Green</span>
                            </div>
                            <div class="admin-summary-legend-item">
                              <span class="admin-summary-legend-dot admin-summary-legend-dot-amber"></span>
                              <span class="admin-summary-legend-text">Amber</span>
                            </div>
                            <div class="admin-summary-legend-item">
                              <span class="admin-summary-legend-dot admin-summary-legend-dot-red"></span>
                              <span class="admin-summary-legend-text">Red</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Equity Overview Section -->
            <section class="admin-section">
              <div class="admin-card">
                <div class="admin-card-header">
                  <div class="admin-card-header-content">
                    <svg xmlns="http://www.w3.org/2000/svg" class="admin-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    <div>
                      <h2 class="admin-card-title">Equity Overview</h2>
                      <p class="admin-card-description">Burden analysis by accessibility needs</p>
                    </div>
                  </div>
                </div>
                <div class="admin-card-body">
                  @if (s.totalPatients === 0) {
                    <div class="admin-empty-state">
                      <svg xmlns="http://www.w3.org/2000/svg" class="admin-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      <p class="admin-empty-title">No data available</p>
                      <p class="admin-empty-description">Equity metrics will appear when patients check in</p>
                    </div>
                  } @else {
                    <div class="admin-table-container">
                      <table class="admin-table">
                        <thead class="admin-table-header">
                          <tr class="admin-table-row">
                            <th class="admin-table-header-cell">Accessibility Flag</th>
                            <th class="admin-table-header-cell admin-table-cell-center">Patients</th>
                            <th class="admin-table-header-cell admin-table-cell-center">Avg Burden</th>
                            <th class="admin-table-header-cell admin-table-cell-center">% Red Alerts</th>
                          </tr>
                        </thead>
                        <tbody class="admin-table-body">
                          @for (key of equityKeys; track key) {
                            @if (s.countByFlag[key] > 0) {
                              <tr class="admin-table-row">
                                <td class="admin-table-cell">
                                  <span class="admin-table-label">{{ EQUITY_LABELS[key] }}</span>
                                </td>
                                <td class="admin-table-cell admin-table-cell-center">
                                  <span class="admin-table-badge">{{ s.countByFlag[key] }}</span>
                                </td>
                                <td class="admin-table-cell admin-table-cell-center">
                                  <div class="admin-table-burden">
                                    <span class="admin-table-burden-value">{{ s.avgBurdenByFlag[key] }}</span>
                                    <span
                                      class="admin-table-burden-indicator"
                                      [class.admin-table-burden-indicator-red]="s.avgBurdenByFlag[key] >= 70"
                                      [class.admin-table-burden-indicator-amber]="s.avgBurdenByFlag[key] >= 45 && s.avgBurdenByFlag[key] < 70"
                                      [class.admin-table-burden-indicator-green]="s.avgBurdenByFlag[key] < 45"
                                    ></span>
                                  </div>
                                </td>
                                <td class="admin-table-cell admin-table-cell-center">
                                  <span
                                    class="admin-table-rate-badge"
                                    [class.admin-table-rate-badge-red]="s.redRateByFlag[key] >= 30"
                                    [class.admin-table-rate-badge-amber]="s.redRateByFlag[key] >= 15 && s.redRateByFlag[key] < 30"
                                    [class.admin-table-rate-badge-green]="s.redRateByFlag[key] < 15"
                                  >
                                    {{ s.redRateByFlag[key] }}%
                                  </span>
                                </td>
                              </tr>
                            }
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </div>
            </section>

            <!-- Model Data Sources Section -->
            <section class="admin-section">
              <div class="admin-card admin-card-sources">
                <div class="admin-card-body">
                  <h3 class="admin-sources-title">Model Data Sources</h3>
                  <div class="admin-sources-list">
                    <div class="admin-sources-item">• CIHI (Canadian Institute for Health Information)</div>
                    <div class="admin-sources-item">• McMaster Health Forum</div>
                    <div class="admin-sources-item">• HQCA (Health Quality Council of Alberta)</div>
                    <div class="admin-sources-item">• Statistics Canada</div>
                  </div>
                  <p class="admin-sources-note">
                    Burden calculations use equity-weighted algorithms to prioritize vulnerable populations
                  </p>
                  <p class="admin-sources-note admin-sources-note-lwbs">
                    Includes hospital-level LWBS baselines (HQCA) and time-to-physician risk modeling (McMaster).
                  </p>
                </div>
              </div>
            </section>
          } @else {
            <div class="admin-loading">
              <div class="admin-loading-spinner"></div>
              <p class="admin-loading-text">Loading dashboard...</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      /* Base Layout */
      .admin-page {
        padding-left: env(safe-area-inset-left, 0);
        padding-right: env(safe-area-inset-right, 0);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }

      /* Header */
      .admin-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .admin-header-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 calc(32px + env(safe-area-inset-right, 0)) 0 calc(32px + env(safe-area-inset-left, 0));
        padding-top: calc(24px + env(safe-area-inset-top, 0));
        padding-bottom: 24px;
      }

      .admin-header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }

      .admin-header-left {
        display: flex;
        align-items: center;
        gap: 24px;
        flex: 1;
        min-width: 0;
      }

      .admin-back-button {
        padding: 8px;
        margin-left: -8px;
        border-radius: 8px;
        transition: background-color 0.15s;
      }

      .admin-back-button:hover {
        background-color: #f3f4f6;
      }

      .admin-header-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .admin-header-icon {
        width: 24px;
        height: 24px;
        color: #2563eb;
        flex-shrink: 0;
      }

      .admin-header-text {
        min-width: 0;
      }

      .admin-title {
        font-size: 1.5rem;
        line-height: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .admin-subtitle {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #4b5563;
        margin: 0;
        margin-top: 2px;
      }

      .admin-badge {
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        color: #374151;
        background: white;
        flex-shrink: 0;
      }

      /* Main Content */
      .admin-main {
        max-width: 1400px;
        margin: 0 auto;
        padding: 48px calc(32px + env(safe-area-inset-right, 0)) calc(64px + env(safe-area-inset-bottom, 0)) calc(32px + env(safe-area-inset-left, 0));
      }

      .admin-content-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px;
      }

      /* Hero Section */
      .admin-hero-section {
        grid-column: 1 / -1;
      }

      .admin-hero-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 24px;
      }

      .admin-metric-card {
        grid-column: span 12;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      @media (min-width: 768px) {
        .admin-metric-card {
          grid-column: span 4;
        }
      }

      .admin-metric-card-primary {
        background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
      }

      .admin-metric-card-secondary {
        background: linear-gradient(to bottom right, #fff7ed, #fef3c7);
      }

      .admin-metric-card-tertiary {
        background: linear-gradient(to bottom right, #faf5ff, #f3e8ff);
      }

      .admin-metric-card-header {
        margin-bottom: 24px;
      }

      .admin-metric-card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
      }

      .admin-metric-card-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .admin-metric-value-large {
        font-size: 3rem;
        line-height: 1;
        font-weight: 700;
        color: #111827;
      }

      .admin-metric-card-primary .admin-metric-value-large {
        color: #1e40af;
      }

      .admin-metric-card-secondary .admin-metric-value-large {
        color: #92400e;
      }

      .admin-metric-card-tertiary .admin-metric-value-large {
        color: #6b21a8;
      }

      .admin-metric-card-lwbs .admin-metric-value-large {
        color: #047857;
      }

      .admin-metric-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-top: 4px;
      }

      .admin-metric-status {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 8px;
      }

      .admin-metric-warning {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: #b45309;
        background: #fef3c7;
        padding: 8px 12px;
        border-radius: 6px;
        margin-top: 12px;
      }

      .admin-metric-warning-icon {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
      }

      /* Sections */
      .admin-section {
        grid-column: 1 / -1;
      }

      .admin-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .admin-card-header {
        padding: 32px;
        border-bottom: 1px solid #e5e7eb;
        background: #fafafa;
      }

      .admin-card-header-content {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .admin-card-icon {
        width: 24px;
        height: 24px;
        color: #2563eb;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .admin-card-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .admin-card-description {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      .admin-card-body {
        padding: 32px;
      }

      .admin-card-sources {
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      .admin-card-sources .admin-card-body {
        padding: 32px;
      }

      /* Health Grid */
      .admin-health-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 48px;
      }

      @media (min-width: 1024px) {
        .admin-health-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .admin-section-subtitle {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 24px 0;
      }

      /* Alert Distribution */
      .admin-alert-section {
        width: 100%;
      }

      .admin-alert-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .admin-alert-item {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .admin-alert-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .admin-alert-item-label {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .admin-alert-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .admin-alert-dot-green {
        background-color: #10b981;
      }

      .admin-alert-dot-amber {
        background-color: #f59e0b;
      }

      .admin-alert-dot-red {
        background-color: #ef4444;
      }

      .admin-alert-text {
        font-size: 0.875rem;
        color: #374151;
      }

      .admin-alert-count {
        font-size: 0.875rem;
        font-weight: 700;
        color: #111827;
      }

      .admin-progress-bar {
        height: 8px;
        background-color: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      .admin-progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .admin-progress-fill-green {
        background-color: #10b981;
      }

      .admin-progress-fill-amber {
        background-color: #f59e0b;
      }

      .admin-progress-fill-red {
        background-color: #ef4444;
      }

      /* Summary Stats */
      .admin-summary-section {
        width: 100%;
      }

      .admin-summary-stats {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .admin-summary-stat {
        padding: 24px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .admin-summary-stat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .admin-summary-stat-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      .admin-summary-stat-badge {
        padding: 4px 12px;
        font-size: 0.875rem;
        font-weight: 600;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        color: #111827;
      }

      .admin-summary-legend {
        display: flex;
        justify-content: space-around;
        gap: 16px;
      }

      .admin-summary-legend-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .admin-summary-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .admin-summary-legend-dot-green {
        background-color: #10b981;
      }

      .admin-summary-legend-dot-amber {
        background-color: #f59e0b;
      }

      .admin-summary-legend-dot-red {
        background-color: #ef4444;
      }

      .admin-summary-legend-text {
        font-size: 0.75rem;
        color: #6b7280;
      }

      /* Table */
      .admin-table-container {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .admin-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .admin-table-header {
        position: sticky;
        top: 0;
        z-index: 5;
        background: #f9fafb;
      }

      .admin-table-row {
        border-bottom: 1px solid #e5e7eb;
      }

      .admin-table-header .admin-table-row {
        border-bottom: 2px solid #d1d5db;
      }

      .admin-table-body .admin-table-row:last-child {
        border-bottom: none;
      }

      .admin-table-header-cell {
        padding: 16px 24px;
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        background: #f9fafb;
        white-space: nowrap;
      }

      .admin-table-cell {
        padding: 20px 24px;
        font-size: 0.875rem;
        color: #111827;
        vertical-align: middle;
      }

      .admin-table-cell-center {
        text-align: center;
      }

      .admin-table-label {
        font-weight: 500;
        color: #111827;
      }

      .admin-table-badge {
        display: inline-block;
        padding: 6px 12px;
        font-size: 0.875rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        color: #111827;
      }

      .admin-table-burden {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .admin-table-burden-value {
        font-weight: 700;
        color: #111827;
      }

      .admin-table-burden-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .admin-table-burden-indicator-green {
        background-color: #10b981;
      }

      .admin-table-burden-indicator-amber {
        background-color: #f59e0b;
      }

      .admin-table-burden-indicator-red {
        background-color: #ef4444;
      }

      .admin-table-rate-badge {
        display: inline-block;
        padding: 6px 12px;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
      }

      .admin-table-rate-badge-green {
        background-color: #d1fae5;
        color: #065f46;
      }

      .admin-table-rate-badge-amber {
        background-color: #fef3c7;
        color: #92400e;
      }

      .admin-table-rate-badge-red {
        background-color: #fee2e2;
        color: #991b1b;
      }

      /* Empty State */
      .admin-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 32px;
        text-align: center;
      }

      .admin-empty-icon {
        width: 48px;
        height: 48px;
        color: #9ca3af;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      .admin-empty-title {
        font-size: 1rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0 0 8px 0;
      }

      .admin-empty-description {
        font-size: 0.875rem;
        color: #9ca3af;
        margin: 0;
      }

      /* Loading State */
      .admin-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 120px 32px;
        grid-column: 1 / -1;
      }

      .admin-loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .admin-loading-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
      }

      /* Sources */
      .admin-sources-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e40af;
        margin: 0 0 16px 0;
      }

      .admin-sources-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .admin-sources-item {
        font-size: 0.875rem;
        color: #1e3a8a;
      }

      .admin-sources-note {
        font-size: 0.75rem;
        color: #3b82f6;
        font-style: italic;
        margin: 0;
      }

      .admin-sources-note-lwbs {
        margin-top: 8px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-header-inner {
          padding-left: 16px;
          padding-right: 16px;
        }

        .admin-main {
          padding: 32px 16px 48px 16px;
        }

        .admin-hero-grid {
          gap: 16px;
        }

        .admin-metric-card {
          padding: 24px;
        }

        .admin-card-header,
        .admin-card-body {
          padding: 24px;
        }

        .admin-content-grid {
          gap: 24px;
        }
      }

      .admin-tap-target {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class AdminComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private adminSummary = inject(AdminSummaryService);
  private patientsApi = inject(PatientsService);
  private store = inject(PatientStoreService);
  private pollSub: Subscription | null = null;

  readonly summary$ = this.adminSummary.getSummary$();

  ngOnInit(): void {
    this.pollSub = interval(ADMIN_POLL_MS)
      .pipe(startWith(0), switchMap(() => this.patientsApi.getAll()))
      .subscribe({ next: (patients) => this.store.setPatientsFromBackend(patients), error: () => {} });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  goBack(): void {
    this.router.navigate(['/staff']);
  }
  readonly EQUITY_LABELS = EQUITY_LABELS;
  readonly equityKeys: EquityFlagKey[] = ['mobility', 'chronicPain', 'sensory', 'cognitive', 'language', 'alone'];
}
