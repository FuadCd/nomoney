import { Component, output, signal, inject, input, effect } from '@angular/core';
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
      <h2 id="hospital-question" class="question">{{ i18n.t('hospitalQuestion') }}</h2>
      <label for="intake-hospital-select" class="visually-hidden">{{ i18n.t('hospitalQuestion') }}</label>
      <select
        id="intake-hospital-select"
        class="hospital-select"
        [value]="hospitalKey()"
        (change)="onHospitalChange($event)"
        required
        [attr.aria-labelledby]="'hospital-question'"
      >
        <option value="" disabled>{{ i18n.t('hospitalPlaceholder') }}</option>
        @for (h of hospitals; track h.key) {
          <option [value]="h.key">{{ h.name }}</option>
        }
      </select>

      <h2 id="discomfort-question" class="question">{{ i18n.t('discomfortQuestion') }}</h2>
      <div class="discomfort-grid" role="group" [attr.aria-labelledby]="'discomfort-question'">
        @for (level of discomfortLevels; track level.value) {
          <button
            type="button"
            class="discomfort-btn"
            (click)="selectDiscomfort(level.value)"
            [class.selected]="discomfortLevel() === level.value"
            [attr.aria-pressed]="discomfortLevel() === level.value"
            [attr.aria-label]="i18n.t('discomfort' + level.value) + ', level ' + level.value"
          >
            <span class="discomfort-num">{{ level.value }}</span>
            <span class="discomfort-label">{{ i18n.t('discomfort' + level.value) }}</span>
          </button>
        }
      </div>

      <button
        type="button"
        class="next-btn"
        (click)="submit()"
        [disabled]="!canSubmit()"
        aria-label="Continue to next step"
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
        border-color: var(--p-accent, #0d47a1);
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .discomfort-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        min-width: 0;
        overflow: auto;
      }
      @media (max-width: 480px) {
        .discomfort-grid { grid-template-columns: repeat(5, 1fr); gap: 0.25rem; }
        .discomfort-btn { min-height: 64px; padding: 0.5rem 0.25rem; }
        .discomfort-num { font-size: 1.25rem; }
        .discomfort-label { font-size: 0.65rem; }
      }
      .discomfort-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80px;
        padding: 0.75rem 0.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        background: var(--p-card-bg, white);
        color: var(--p-fg, #1a1a1a);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        overflow: auto;
        min-width: 0;
      }
      .discomfort-num { font-size: 1.5rem; font-weight: 700; display: block; flex-shrink: 0; }
      .discomfort-label {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
        overflow-wrap: break-word;
        word-wrap: break-word;
        text-align: center;
        overflow: auto;
      }
      .discomfort-btn.selected,
      .discomfort-btn:hover {
        border-color: #2563eb;
        background: #eff6ff;
        color: #2563eb;
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
  readonly initialHospitalKey = input<string | undefined>();

  readonly hospitalKey = signal('');

  constructor() {
    effect(() => {
      const init = this.initialHospitalKey();
      if (init && this.hospitals.some((h) => h.key === init)) {
        this.hospitalKey.set(init);
      }
    });
  }
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
