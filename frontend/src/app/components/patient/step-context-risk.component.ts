import { Component, output, signal, inject } from '@angular/core';
import { I18nService } from '../../features/patient/patient.component';
import { INTAKE_HOSPITALS } from './step-hospital.component';

export interface ContextRiskResult {
  hospitalKey: string;
  discomfortLevel: number;
}

@Component({
  selector: 'app-step-context-risk',
  standalone: true,
  template: `
    <div class="step">
      <h2 class="question">{{ i18n.t('hospitalQuestion') }}</h2>
      <select
        class="hospital-select"
        [value]="hospitalKey()"
        (change)="onHospitalChange($event)"
        required
        aria-label="Select hospital"
      >
        <option value="" disabled>{{ i18n.t('hospitalPlaceholder') }}</option>
        @for (h of hospitals; track h.key) {
          <option [value]="h.key">{{ h.name }}</option>
        }
      </select>

      <h2 class="question">{{ i18n.t('discomfortQuestion') }}</h2>
      <div class="discomfort-buttons">
        @for (level of discomfortLevels; track level.value) {
          <button
            type="button"
            class="discomfort-btn"
            (click)="selectDiscomfort(level.value)"
            [class.selected]="discomfortLevel() === level.value"
            [attr.aria-label]="'Discomfort ' + level.value"
          >
            {{ i18n.t('discomfort' + level.value) }}
          </button>
        }
      </div>

      <button
        type="button"
        class="next-btn"
        (click)="submit()"
        [disabled]="!canSubmit()"
        aria-label="Continue"
      >
        {{ i18n.t('continue') }}
      </button>
    </div>
  `,
  styles: [
    `
      .step {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .question {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0;
      }
      .hospital-select {
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid var(--p-accent, #0d47a1);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-fg, #1a1a1a);
        cursor: pointer;
      }
      .hospital-select:focus {
        outline: none;
        border-color: var(--p-accent, #0d47a1);
      }
      .discomfort-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .discomfort-btn {
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1.1rem;
        font-weight: 600;
        border: 2px solid var(--p-border, #bbb);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-fg, #1a1a1a);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .discomfort-btn.selected,
      .discomfort-btn:hover {
        border-color: var(--p-accent, #0d47a1);
        background: var(--p-light-accent, #e3f2fd);
        color: var(--p-accent, #0d47a1);
      }
      .next-btn {
        width: 100%;
        min-height: 56px;
        margin-top: 0.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        background: var(--p-accent, #0d47a1);
        color: var(--p-accent-fg, white);
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .next-btn:hover:not(:disabled) {
        opacity: 0.95;
      }
      .next-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class StepContextRiskComponent {
  readonly completed = output<ContextRiskResult>();
  readonly i18n = inject(I18nService);
  readonly hospitals = INTAKE_HOSPITALS;

  readonly hospitalKey = signal('');
  readonly discomfortLevel = signal<number | null>(null);

  readonly discomfortLevels = [
    { value: 1 },
    { value: 2 },
    { value: 3 },
    { value: 4 },
    { value: 5 },
  ];

  onHospitalChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.hospitalKey.set(value);
  }

  selectDiscomfort(value: number): void {
    this.discomfortLevel.set(value);
  }

  canSubmit(): boolean {
    return this.hospitalKey().length > 0 && this.discomfortLevel() !== null;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const key = this.hospitalKey();
    const level = this.discomfortLevel();
    if (!key || level == null) return;
    this.completed.emit({ hospitalKey: key, discomfortLevel: level });
  }
}
