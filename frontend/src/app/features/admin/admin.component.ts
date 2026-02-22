import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AdminSummaryService, type AdminSummary, type EquityFlagKey } from '../../core/services/admin-summary.service';

const EQUITY_LABELS: Record<EquityFlagKey, string> = {
  mobility: 'Mobility',
  chronicPain: 'Chronic Pain',
  sensory: 'Sensory',
  cognitive: 'Cognitive',
  language: 'Language',
  alone: 'Alone',
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="admin-page min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b shadow-sm">
        <div class="admin-header-inner">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                (click)="goBack()"
                class="admin-tap-target p-2 -ml-2 rounded hover:bg-gray-100"
                aria-label="Back to Staff"
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
                  <h1 class="admin-title text-lg sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p class="text-sm text-gray-600">Model Health & Equity Overview</p>
                </div>
              </div>
            </div>
            <span class="px-2 py-1 text-xs font-medium border border-gray-300 rounded shrink-0">
              Read-only
            </span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="admin-main space-y-6">
        @if (summary$ | async; as s) {
          <!-- Model Health -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Model Health
              </h2>
              <p class="text-sm text-gray-600 mt-1">Overall system performance and alert distribution</p>
            </div>
            <div class="p-6">
              <div class="grid md:grid-cols-3 gap-6">
                <!-- Alert Distribution -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-sm text-gray-700">Alert Distribution</h3>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-green-500"></span>
                        <span class="text-sm">Green (OK)</span>
                      </div>
                      <span class="text-sm font-bold">{{ s.alertDistribution.green }}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-green-600 rounded-full" [style.width.%]="s.alertDistribution.greenPercent"></div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span class="text-sm">Amber (Warning)</span>
                      </div>
                      <span class="text-sm font-bold">{{ s.alertDistribution.amber }}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-amber-600 rounded-full" [style.width.%]="s.alertDistribution.amberPercent"></div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-red-500"></span>
                        <span class="text-sm">Red (Urgent)</span>
                      </div>
                      <span class="text-sm font-bold">{{ s.alertDistribution.red }}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-red-600 rounded-full" [style.width.%]="s.alertDistribution.redPercent"></div>
                    </div>
                  </div>
                </div>

                <!-- Average Burden -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-sm text-gray-700">Average Burden Index</h3>
                  <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div class="text-5xl font-bold text-blue-900">{{ s.avgBurden }}</div>
                    <div class="text-sm text-blue-700 mt-2">out of 100</div>
                  </div>
                  <div class="text-xs text-gray-600 text-center">
                    {{ s.avgBurden < 45 ? 'System performing well' : s.avgBurden < 70 ? 'Moderate load' : 'High system burden' }}
                  </div>
                </div>

                <!-- Missed Check-in Rate -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-sm text-gray-700">Missed Check-in Rate</h3>
                  <div class="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
                    <div class="text-5xl font-bold text-orange-900">{{ s.missedCheckInRate }}%</div>
                    <div class="text-sm text-orange-700 mt-2">of patients</div>
                  </div>
                  @if (s.missedCheckInRate > 20) {
                    <div class="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <span>Above threshold</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Equity Overview -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                Equity Overview
              </h2>
              <p class="text-sm text-gray-600 mt-1">Burden analysis by accessibility needs</p>
            </div>
            <div class="p-6">
              @if (s.totalPatients === 0) {
                <div class="text-center py-12 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <p>No data available</p>
                  <p class="text-sm mt-1">Equity metrics will appear when patients check in</p>
                </div>
              } @else {
                <div class="space-y-4">
                  <div class="grid grid-cols-4 gap-4 pb-3 border-b border-gray-200 font-semibold text-sm text-gray-700">
                    <div>Accessibility Flag</div>
                    <div class="text-center">Patients</div>
                    <div class="text-center">Avg Burden</div>
                    <div class="text-center">% Red Alerts</div>
                  </div>
                  @for (key of equityKeys; track key) {
                    @if (s.countByFlag[key] > 0) {
                      <div class="grid grid-cols-4 gap-4 py-3 border-b border-gray-100 last:border-0 items-center">
                        <div class="font-medium">{{ EQUITY_LABELS[key] }}</div>
                        <div class="text-center">
                          <span class="px-2 py-0.5 border border-gray-300 rounded text-sm">{{ s.countByFlag[key] }}</span>
                        </div>
                        <div class="text-center">
                          <span class="font-bold">{{ s.avgBurdenByFlag[key] }}</span>
                          <span
                            class="inline-block w-2 h-2 rounded-full ml-2"
                            [class.bg-red-500]="s.avgBurdenByFlag[key] >= 70"
                            [class.bg-amber-500]="s.avgBurdenByFlag[key] >= 45 && s.avgBurdenByFlag[key] < 70"
                            [class.bg-green-500]="s.avgBurdenByFlag[key] < 45"
                          ></span>
                        </div>
                        <div class="text-center">
                          <span
                            class="px-2 py-0.5 rounded text-sm font-medium"
                            [class.bg-red-100]="s.redRateByFlag[key] >= 30"
                            [class.text-red-800]="s.redRateByFlag[key] >= 30"
                            [class.bg-amber-100]="s.redRateByFlag[key] >= 15 && s.redRateByFlag[key] < 30"
                            [class.text-amber-800]="s.redRateByFlag[key] >= 15 && s.redRateByFlag[key] < 30"
                            [class.bg-green-100]="s.redRateByFlag[key] < 15"
                            [class.text-green-800]="s.redRateByFlag[key] < 15"
                          >
                            {{ s.redRateByFlag[key] }}%
                          </span>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          </div>

          <!-- Model Data Sources -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div class="text-sm space-y-2">
              <div class="font-semibold text-blue-900">Model Data Sources</div>
              <div class="text-blue-800 space-y-1">
                <div>• CIHI (Canadian Institute for Health Information)</div>
                <div>• McMaster Health Forum</div>
                <div>• HQCA (Health Quality Council of Alberta)</div>
                <div>• Statistics Canada</div>
              </div>
              <p class="text-xs text-blue-700 mt-3 italic">
                Burden calculations use equity-weighted algorithms to prioritize vulnerable populations
              </p>
            </div>
          </div>
        } @else {
          <div class="text-center py-12 text-gray-500">Loading...</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .admin-page { padding-left: env(safe-area-inset-left, 0); padding-right: env(safe-area-inset-right, 0); padding-bottom: env(safe-area-inset-bottom, 0); }
      .admin-header-inner {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1rem calc(1rem + env(safe-area-inset-right, 0)) 1rem calc(1rem + env(safe-area-inset-left, 0));
        padding-top: calc(1rem + env(safe-area-inset-top, 0));
      }
      .admin-main {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1rem calc(1rem + env(safe-area-inset-right, 0)) calc(1.5rem + env(safe-area-inset-bottom, 0)) calc(1rem + env(safe-area-inset-left, 0));
      }
      @media (min-width: 640px) {
        .admin-header-inner, .admin-main { padding-left: 1.5rem; padding-right: 1.5rem; }
      }
      .admin-tap-target { min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; }
    `,
  ],
})
export class AdminComponent {
  private router = inject(Router);
  private adminSummary = inject(AdminSummaryService);

  readonly summary$ = this.adminSummary.getSummary$();

  goBack(): void {
    this.router.navigate(['/staff']);
  }
  readonly EQUITY_LABELS = EQUITY_LABELS;
  readonly equityKeys: EquityFlagKey[] = ['mobility', 'chronicPain', 'sensory', 'cognitive', 'language', 'alone'];
}
