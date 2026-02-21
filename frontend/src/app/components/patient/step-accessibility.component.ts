import { Component, output, signal, inject } from '@angular/core';
import { I18nService, IntakeAccessibilityProfile } from '../../features/patient/patient.component';

@Component({
  selector: 'app-step-accessibility',
  standalone: true,
  template: `
    <div class="step">
      <p class="intro">{{ i18n.t('accessibilityIntro') }}</p>
      <p class="q-count">{{ i18n.t('questionXof6', { n: (currentQ() + 1).toString() }) }}</p>

      <h2 class="question">{{ i18n.t(questions[currentQ()].key) }}</h2>

      <div class="yn-buttons">
        <button class="yn-btn yes" (click)="answer(true)" [attr.aria-label]="i18n.t('yes')">
          {{ i18n.t('yes') }}
        </button>
        <button class="yn-btn no" (click)="answer(false)" [attr.aria-label]="i18n.t('no')">
          {{ i18n.t('no') }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .step {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .intro {
        text-align: center;
        color: var(--p-muted, #555);
        font-size: 1rem;
        margin: 0;
      }
      .q-count {
        text-align: center;
        font-weight: 600;
        color: var(--p-accent, #0d47a1);
        margin: 0;
        font-size: 0.9rem;
      }
      .question {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        text-align: center;
        margin: 0.5rem 0;
        line-height: 1.4;
      }
      .yn-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
      .yn-btn {
        width: 100%;
        min-height: 80px;
        font-size: 1.5rem;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition:
          transform 0.1s,
          opacity 0.1s;
      }
      .yn-btn:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      .yes {
        background: var(--p-green, #2e7d32);
        color: white;
      }
      .no {
        background: var(--p-red, #c62828);
        color: white;
      }
    `,
  ],
})
export class StepAccessibilityComponent {
  readonly completed = output<IntakeAccessibilityProfile>();
  readonly i18n = inject(I18nService);
  readonly currentQ = signal(0);

  readonly questions: { key: string; field: keyof IntakeAccessibilityProfile }[] = [
    { key: 'q_mobility', field: 'mobility' },
    { key: 'q_sensory', field: 'sensory' },
    { key: 'q_chronicPain', field: 'chronicPain' },
    { key: 'q_cognitive', field: 'cognitive' },
    { key: 'q_language', field: 'language' },
    { key: 'q_support', field: 'supportPerson' },
  ];

  private answers: Partial<Record<keyof IntakeAccessibilityProfile, boolean>> = {};

  answer(value: boolean): void {
    const q = this.questions[this.currentQ()];
    this.answers[q.field] = value;
    if (this.currentQ() < 5) {
      this.currentQ.update((v) => v + 1);
    } else {
      this.completed.emit({
        mobility: this.answers['mobility'] ?? false,
        sensory: this.answers['sensory'] ?? false,
        chronicPain: this.answers['chronicPain'] ?? false,
        cognitive: this.answers['cognitive'] ?? false,
        language: this.answers['language'] ?? false,
        supportPerson: this.answers['supportPerson'] ?? false,
      });
    }
  }
}
