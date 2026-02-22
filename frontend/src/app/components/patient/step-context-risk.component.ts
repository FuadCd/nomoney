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
      <h2 class="question">{{ i18n.t('hospitalQuestion') }}</h2>
      <select
        id="intake-hospital-select"
        class="hospital-select"
        [value]="hospitalKey()"
        (change)="onHospitalChange($event)"
        required
        [attr.aria-label]="i18n.t('hospitalPlaceholder')"
      >
        <option value="" disabled>{{ i18n.t('hospitalPlaceholder') }}</option>
        @for (h of hospitals; track h.key) {
          <option [value]="h.key">{{ h.name }}</option>
        }
      </select>

      <fieldset class="discomfort-fieldset">
        <legend class="discomfort-legend">{{ i18n.t('discomfortQuestion') }}</legend>
        <div class="discomfort-grid">
          @for (level of discomfortLevels; track level.value) {
            <div class="discomfort-option">
              <input
                type="radio"
                [id]="'discomfort-' + level.value"
                name="discomfort"
                [value]="level.value"
                [checked]="discomfortLevel() === level.value"
                (change)="selectDiscomfort(level.value)"
                class="discomfort-radio"
              />
              <label [for]="'discomfort-' + level.value" class="discomfort-label-wrap">
                <span class="discomfort-num">{{ level.value }}</span>
                <span class="discomfort-label">{{ level.value }} {{ i18n.t('discomfort' + level.value) }}</span>
              </label>
            </div>
          }
        </div>
      </fieldset>

      @if (incompleteError()) {
        <p id="step1-incomplete-error" class="step1-error" role="alert" aria-live="polite">
          {{ incompleteError() }}
        </p>
      }
      <button
        type="button"
        class="next-btn"
        (click)="submit()"
        [attr.aria-describedby]="incompleteError() ? 'step1-incomplete-error' : null"
        [class.next-btn-dimmed]="!canSubmit()"
        aria-label="Continue"
      >{{ i18n.t('continue') }}</button>
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
      .discomfort-fieldset {
        border: none;
        margin: 0;
        padding: 0;
      }
      .discomfort-legend {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin-bottom: 0.75rem;
      }
      .discomfort-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        min-width: 0;
      }
      @media (max-width: 480px) {
        .discomfort-grid { gap: 0.25rem; }
        .discomfort-label-wrap { min-height: 64px; padding: 0.5rem 0.25rem; }
        .discomfort-num { font-size: 1.25rem; }
        .discomfort-label { font-size: 0.65rem; }
      }
      .discomfort-option {
        position: relative;
        min-height: 80px;
      }
      .discomfort-radio {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
      }
      .discomfort-radio:focus-visible + .discomfort-label-wrap {
        outline: 3px solid var(--p-accent, #2563eb);
        outline-offset: 2px;
      }
      .discomfort-label-wrap {
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
        box-sizing: border-box;
      }
      .discomfort-radio:checked + .discomfort-label-wrap {
        border-color: #2563eb;
        background: #eff6ff;
        color: #2563eb;
      }
      .discomfort-label-wrap:hover {
        border-color: #2563eb;
        background: #eff6ff;
        color: #2563eb;
      }
      .discomfort-num { font-size: 1.5rem; font-weight: 700; display: block; flex-shrink: 0; }
      .discomfort-label {
        font-size: 0.75rem;
        color: inherit;
        margin-top: 0.25rem;
        overflow-wrap: break-word;
        word-wrap: break-word;
        text-align: center;
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
        /* Voice Control: ensure button is always hit-testable (no overlay can block) */
        pointer-events: auto;
      }
      .next-btn:hover:not(.next-btn-dimmed) {
        opacity: 0.95;
      }
      .next-btn-dimmed {
        opacity: 0.5;
      }
      .step1-error {
        margin: 0;
        padding: 0.75rem 1rem;
        font-size: 0.9375rem;
        color: #b91c1c;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.5rem;
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
  readonly incompleteError = signal('');

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
    this.incompleteError.set('');
  }

  selectDiscomfort(value: number): void {
    this.discomfortLevel.set(value);
    this.incompleteError.set('');
  }

  canSubmit(): boolean {
    return this.hospitalKey().length > 0 && this.discomfortLevel() !== null;
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.incompleteError.set(this.i18n.t('incompleteStep1'));
      this.focusFirstInvalid();
      return;
    }
    this.incompleteError.set('');
    const key = this.hospitalKey();
    const level = this.discomfortLevel();
    if (!key || level == null) return;
    this.completed.emit({ hospitalKey: key, discomfortLevel: level });
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      if (typeof document === 'undefined') return;
      if (!this.hospitalKey()) {
        const el = document.getElementById('intake-hospital-select');
        if (el instanceof HTMLSelectElement) el.focus();
      } else {
        const el = document.getElementById('discomfort-1');
        if (el instanceof HTMLInputElement) el.focus();
      }
    }, 0);
  }
}
