import { Component, output, inject } from '@angular/core';
import { I18nService } from '../../features/patient/patient.component';

/** Facility keys and names matching backend alberta-waittimes.snapshot (for wait times, burden, LWBS). */
export const INTAKE_HOSPITALS: { key: string; name: string }[] = [
  { key: 'uofa', name: 'University of Alberta Hospital' },
  { key: 'royalAlexandra', name: 'Royal Alexandra Hospital' },
  { key: 'greyNuns', name: 'Grey Nuns Community Hospital' },
  { key: 'misericordia', name: 'Misericordia Community Hospital' },
  { key: 'sturgeon', name: 'Sturgeon Community Hospital' },
];

@Component({
  selector: 'app-step-hospital',
  standalone: true,
  template: `
    <div class="step">
      <h2 class="question">{{ i18n.t('hospitalQuestion') }}</h2>
      <p class="hint">{{ i18n.t('hospitalHint') }}</p>
      <div class="hospital-list">
        @for (h of hospitals; track h.key) {
          <button
            type="button"
            class="hospital-btn"
            (click)="select(h.key)"
            [attr.aria-label]="'Select ' + h.name"
          >
            {{ h.name }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .step {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .question {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0;
      }
      .hint {
        font-size: 0.95rem;
        color: var(--p-muted, #555);
        margin: 0;
      }
      .hospital-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .hospital-btn {
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        text-align: left;
        border: 2px solid var(--p-accent, #0d47a1);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-accent, #0d47a1);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .hospital-btn:hover,
      .hospital-btn:active {
        background: var(--p-accent, #0d47a1);
        color: var(--p-accent-fg, white);
      }
    `,
  ],
})
export class StepHospitalComponent {
  readonly completed = output<string>();
  readonly i18n = inject(I18nService);
  readonly hospitals = INTAKE_HOSPITALS;

  select(facilityKey: string): void {
    this.completed.emit(facilityKey);
  }
}
