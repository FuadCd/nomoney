import { Component, output, signal, inject } from '@angular/core';
import { I18nService, IntakeAccessibilityProfile } from '../../features/patient/patient.component';

type ProfileKey = keyof IntakeAccessibilityProfile;

interface ToggleItem {
  key: ProfileKey;
  i18nKey: string;
}

@Component({
  selector: 'app-step-accessibility-toggles',
  standalone: true,
  template: `
    <div class="step">
      <h2 class="title">{{ i18n.t('accessibilityTitle') }}</h2>
      <div class="toggles">
        @for (item of toggles; track item.key) {
          <label class="toggle-row">
            <input
              type="checkbox"
              [checked]="profile()[item.key]"
              (change)="toggle(item.key)"
              [attr.aria-label]="i18n.t(item.i18nKey)"
            />
            <span class="toggle-label">{{ i18n.t(item.i18nKey) }}</span>
          </label>
        }
      </div>
      <button
        type="button"
        class="next-btn"
        (click)="submit()"
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
      .title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0;
      }
      .toggles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .toggle-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: 2px solid var(--p-border, #bbb);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        cursor: pointer;
        transition: border-color 0.15s;
      }
      .toggle-row:hover {
        border-color: var(--p-accent, #0d47a1);
      }
      .toggle-row input[type='checkbox'] {
        width: 22px;
        height: 22px;
        margin: 0;
        flex-shrink: 0;
        accent-color: var(--p-accent, #0d47a1);
        cursor: pointer;
      }
      .toggle-label {
        font-size: 1rem;
        line-height: 1.4;
        color: var(--p-fg, #1a1a1a);
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
      .next-btn:hover {
        opacity: 0.95;
      }
    `,
  ],
})
export class StepAccessibilityTogglesComponent {
  readonly completed = output<IntakeAccessibilityProfile>();
  readonly i18n = inject(I18nService);

  readonly toggles: ToggleItem[] = [
    { key: 'chronicPain', i18nKey: 'toggle_chronicPain' },
    { key: 'mobility', i18nKey: 'toggle_mobility' },
    { key: 'sensory', i18nKey: 'toggle_sensory' },
    { key: 'cognitive', i18nKey: 'toggle_cognitive' },
    { key: 'alone', i18nKey: 'toggle_alone' },
    { key: 'language', i18nKey: 'toggle_language' },
  ];

  readonly profile = signal<IntakeAccessibilityProfile>({
    chronicPain: false,
    mobility: false,
    sensory: false,
    cognitive: false,
    alone: false,
    language: false,
  });

  toggle(key: ProfileKey): void {
    this.profile.update((p) => ({ ...p, [key]: !p[key] }));
  }

  submit(): void {
    this.completed.emit(this.profile());
  }
}
