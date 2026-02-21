import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../patient.component';

@Component({
  selector: 'app-waiting',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="waiting fade-in">
      <div class="check-icon">✅</div>
      <h2>{{ i18n.t('waitingTitle') }}</h2>
      <p class="pid">
        {{ i18n.t('patientId') }}: <strong>{{ patientId() }}</strong>
      </p>
      <p class="time">{{ i18n.t('waitingTime') }}</p>
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
export class WaitingComponent {
  readonly i18n = inject(I18nService);
  readonly patientId = signal(
    typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('patient_id') ?? '—') : '—',
  );
}
