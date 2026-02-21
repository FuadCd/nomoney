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
    <div class="waiting fade-in">
      <button type="button" class="back-link back-btn" (click)="back()">&larr; Back</button>
      <div class="check-icon">✅</div>
      <h2>{{ i18n.t('waitingTitle') }}</h2>
      <p class="pid">
        {{ i18n.t('patientId') }}: <strong>{{ patientId() }}</strong>
      </p>
      <p class="time">
        @if (estimatedWaitFormatted(); as formatted) {
          {{ i18n.t('waitingTimeLabel') }}: {{ formatted }}
        } @else {
          {{ i18n.t('waitingTime') }}
        }
      </p>
      <p class="message">{{ i18n.t('waitingMessage') }}</p>
      <a class="checkin-link" routerLink="/patient/checkin" aria-label="Go to check-in">
        {{ i18n.t('checkinTitle') }}
      </a>
    </div>
  `,
  styles: [
    `
      .waiting {
        text-align: center;
        padding: 2rem 0.5rem;
      }
      .back-link {
        display: block;
        text-align: left;
        margin-bottom: 1rem;
        color: var(--p-accent, #0d47a1);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .back-btn {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
      }
      .fade-in {
        animation: fadeSlide 0.3s ease-out;
      }
      @keyframes fadeSlide {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .check-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      h2 {
        font-size: 1.5rem;
        color: var(--p-green, #2e7d32);
        margin: 0 0 0.75rem;
      }
      .pid {
        font-size: 0.95rem;
        color: var(--p-accent, #0d47a1);
        background: var(--p-light-accent, #e3f2fd);
        display: inline-block;
        padding: 0.4rem 1rem;
        border-radius: 8px;
        margin: 0 0 1rem;
        letter-spacing: 1px;
      }
      .time {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0 0 0.5rem;
      }
      .message {
        font-size: 1.1rem;
        color: var(--p-muted, #555);
        margin: 0 0 1.5rem;
      }
      .checkin-link {
        display: inline-block;
        padding: 0.75rem 2rem;
        background: var(--p-accent, #0d47a1);
        color: var(--p-accent-fg, white);
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        min-height: 48px;
        line-height: 48px;
        transition: background 0.15s;
      }
      .checkin-link:active {
        opacity: 0.85;
      }
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

  /** Back: previous in session sequence is Intake step 3 (confirm). */
  back(): void {
    this.router.navigate(['/patient/intake/3']);
  }
}
