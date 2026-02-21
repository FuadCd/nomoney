import { Component, input, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService, IntakeAccessibilityProfile } from '../../features/patient/patient.component';
import { PatientStoreService } from '../../core/patient-store.service';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-step-confirm',
  standalone: true,
  template: `
    <div class="step">
      <div class="passport">
        <h2 class="passport-title">{{ i18n.t('passportTitle') }}</h2>
        <div class="passport-id">{{ anonymousId() }}</div>
        <div class="passport-icons">
          @for (icon of topIcons(); track $index) {
            <span class="icon">{{ icon }}</span>
          }
        </div>
        <div class="passport-urgency">
          {{ i18n.t('urgencyLabel') }}: <strong>{{ urgencyText() }}</strong>
        </div>
      </div>

      <button
        class="confirm-btn"
        (click)="onConfirm()"
        [disabled]="loading()"
        [attr.aria-label]="i18n.t('confirmButton')"
      >
        @if (loading()) {
          <span class="spinner"></span>
        } @else {
          {{ i18n.t('confirmButton') }}
        }
      </button>
    </div>
  `,
  styles: [
    `
      .step {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .passport {
        background: var(--p-card-bg, white);
        border: 2px solid var(--p-accent, #0d47a1);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      .passport-title {
        font-size: 1.1rem;
        color: var(--p-accent, #0d47a1);
        margin: 0 0 0.75rem;
      }
      .passport-id {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--p-fg, #1a1a1a);
        letter-spacing: 3px;
        margin-bottom: 0.75rem;
        font-family: monospace;
      }
      .passport-icons {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        display: flex;
        justify-content: center;
        gap: 0.75rem;
      }
      .passport-urgency {
        font-size: 1rem;
        color: var(--p-muted, #555);
      }
      .confirm-btn {
        width: 100%;
        min-height: 64px;
        font-size: 1.2rem;
        font-weight: 700;
        background: var(--p-green, #2e7d32);
        color: white;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition:
          transform 0.1s,
          opacity 0.1s;
      }
      .confirm-btn:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      .confirm-btn:disabled {
        opacity: 0.7;
        cursor: wait;
      }
      .spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class StepConfirmComponent {
  readonly complaint = input.required<string>();
  readonly severity = input.required<number>();
  readonly accessibilityProfile = input.required<IntakeAccessibilityProfile>();
  readonly anonymousId = input.required<string>();

  readonly i18n = inject(I18nService);
  private readonly store = inject(PatientStoreService);
  private readonly router = inject(Router);
  readonly loading = signal(false);

  readonly topIcons = computed(() => {
    const profile = this.accessibilityProfile();
    const map: [keyof IntakeAccessibilityProfile, string][] = [
      ['mobility', '♿'],
      ['sensory', '🔇'],
      ['chronicPain', '💊'],
      ['cognitive', '🔍'],
      ['language', '🤫'],
      ['supportPerson', '🤝'],
    ];
    return map
      .filter(([k]) => profile[k])
      .map(([, icon]) => icon)
      .slice(0, 3);
  });

  readonly urgencyText = computed(() => {
    const s = this.severity();
    if (s <= 2) return this.i18n.t('urgencyLow');
    if (s <= 3) return this.i18n.t('urgencyMedium');
    if (s <= 4) return this.i18n.t('urgencyHigh');
    return this.i18n.t('urgencyUrgent');
  });

  onConfirm(): void {
    this.loading.set(true);
    const profile = this.accessibilityProfile();
    const flagCount = Object.values(profile).filter(Boolean).length;
    const vulnScore = Math.min((this.severity() / 5) * 0.5 + (flagCount / 6) * 0.5, 1);

    const patient: Patient = {
      id: this.anonymousId(),
      waitStart: Date.now(),
      vulnerabilityScore: +vulnScore.toFixed(2),
      burdenIndex: 0,
      alertLevel: 'green',
      flags: {
        mobility: profile.mobility,
        language: profile.language,
        sensory: profile.sensory,
        cognitive: profile.cognitive,
        chronicPain: profile.chronicPain,
      },
      checkIns: [],
    };

    this.store.addPatient(patient);
    // Brief delay for spinner UX
    setTimeout(() => this.router.navigate(['/patient/waiting']), 600);
  }
}
