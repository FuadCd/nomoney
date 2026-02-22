import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../patient.component';
import { PatientStoreService } from '../../../core/patient-store.service';
import { WaitTimesService } from '../../../core/services/wait-times.service';
import { HOSPITAL_WAIT_MINUTES } from '../../../core/constants/hospital-wait-minutes';

@Component({
  selector: 'app-waiting',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="waiting fade-in p-4">
      <button type="button" class="back-link back-btn mb-6" (click)="back()" aria-label="Back to home">&larr; Back</button>
      <div class="waiting-card">
        <div class="check-confirm">
          <svg xmlns="http://www.w3.org/2000/svg" class="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2>{{ i18n.t('waitingTitle') }}</h2>
          <p class="message">{{ i18n.t('waitingMessage') }}</p>
        </div>
        <div class="pid-box">
          <span class="pid-label">{{ i18n.t('patientId') }}</span>
          <span class="pid-value">{{ patientId() }}</span>
        </div>
      </div>
      <div class="wait-time-card">
        <h3 class="wait-time-title">{{ i18n.t('waitingTimeLabel') }}</h3>
        <p class="time" aria-live="polite" aria-atomic="true">
          @if (estimatedWaitFormatted(); as formatted) {
            {{ formatted }}
          } @else {
            ~15 min
          }
        </p>
      </div>
      <div class="checkin-card">
        <p class="checkin-reminder">We'll check in with you every 20 minutes. Update your status to help us support you.</p>
        <a class="checkin-link" routerLink="/patient/checkin">
          {{ i18n.t('checkinTitle') }}
        </a>
      </div>
    </main>
  `,
  styles: [
    `
      .waiting {
        max-width: 672px;
        margin: 0 auto;
        padding-left: env(safe-area-inset-left, 0);
        padding-right: env(safe-area-inset-right, 0);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .back-link {
        display: inline-block;
        color: var(--p-accent, #2563eb);
        text-decoration: none;
        font-size: 0.875rem;
      }
      .back-link:hover { text-decoration: underline; }
      .back-btn {
        background: none; border: none; padding: 0.5rem 0; font: inherit; cursor: pointer;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
      }
      .fade-in { animation: fadeSlide 0.3s ease-out; }
      @keyframes fadeSlide {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .waiting-card {
        background: #f0fdf4;
        border: 2px solid #bbf7d0;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .check-confirm { margin-bottom: 1rem; }
      .check-icon { width: 2rem; height: 2rem; color: #16a34a; margin-bottom: 0.5rem; }
      .waiting-card h2 { font-size: 1.25rem; font-weight: 700; color: #166534; margin: 0 0 0.25rem; }
      .waiting-card .message { font-size: 0.875rem; color: #15803d; margin: 0; }
      .pid-box {
        background: white;
        border: 1px solid #bbf7d0;
        border-radius: 0.5rem;
        padding: 1rem;
        text-align: center;
      }
      .pid-label { font-size: 0.875rem; color: #6b7280; display: block; }
      .pid-value { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.05em; color: #1a1a1a; }
      .wait-time-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .wait-time-title { font-size: 0.875rem; color: #6b7280; margin: 0 0 0.5rem; }
      .time { font-size: 1.875rem; font-weight: 700; color: #1a1a1a; margin: 0; }
      .checkin-card {
        background: white;
        border: 2px solid #bfdbfe;
        border-radius: 0.5rem;
        padding: 1.5rem;
        text-align: center;
      }
      .checkin-reminder { font-size: 0.875rem; color: #6b7280; margin: 0 0 1rem; }
      .checkin-link {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1.5rem;
        min-height: 48px;
        box-sizing: border-box;
        background: #2563eb;
        color: white;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        transition: background 0.15s;
      }
      .checkin-link:hover { background: #1d4ed8; }
    `,
  ],
})
export class WaitingComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly store = inject(PatientStoreService);
  private readonly waitTimes = inject(WaitTimesService);

  readonly patientId = signal(
    typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('patient_id') ?? '—') : '—',
  );
  readonly estimatedWaitFormatted = signal<string | null>(null);

  ngOnInit(): void {
    const pid = this.patientId();
    if (pid === '—') return;
    const patient = this.store.getPatientById(pid);
    const hospitalKey =
      patient?.assignedHospitalKey ??
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('patient_hospital_key') : null);
    if (!hospitalKey) return;

    const setWaitFromMinutes = (waitMinutes: number) => {
      this.estimatedWaitFormatted.set(this.formatWaitMinutes(waitMinutes));
    };

    this.waitTimes.getHospitalWaitTime(hospitalKey).subscribe({
      next: (hospital) => {
        if (hospital?.waitMinutes != null) {
          setWaitFromMinutes(hospital.waitMinutes);
        } else {
          const fallback = HOSPITAL_WAIT_MINUTES[hospitalKey];
          if (fallback != null) setWaitFromMinutes(fallback);
        }
      },
      error: () => {
        const fallback = HOSPITAL_WAIT_MINUTES[hospitalKey];
        if (fallback != null) setWaitFromMinutes(fallback);
      },
    });
  }

  /** Format waitMinutes as "Xh Ym" or "N min". */
  private formatWaitMinutes(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  /** Back: after check-in, return to home. */
  back(): void {
    this.router.navigate(['/']);
  }
}
