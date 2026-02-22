import { Component, output, signal, inject } from '@angular/core';
import { I18nService, IntakeAccessibilityProfile } from '../../features/patient/patient.component';

type ProfileKey = keyof IntakeAccessibilityProfile;

interface ToggleItem {
  key: ProfileKey;
  i18nKey: string;
  icon: string;
}

@Component({
  selector: 'app-step-accessibility-toggles',
  standalone: true,
  template: `
    <div class="step">
      <fieldset class="access-fieldset">
        <legend class="access-legend">{{ i18n.t('accessibilityTitle') }}</legend>
        <p class="subtitle">{{ i18n.t('accessibilitySubtitle') }}</p>
        <div class="accessibility-options">
          @for (item of toggles; track item.key) {
            <div class="access-option">
              <input
                type="checkbox"
                [id]="'acc-' + item.key"
                [checked]="profile()[item.key]"
                (change)="toggle(item.key)"
                class="access-checkbox"
              />
              <label [for]="'acc-' + item.key" class="access-label">
                <span class="access-icon" aria-hidden="true">{{ item.icon }}</span>
                <span class="access-text">{{ i18n.t(item.i18nKey) }}</span>
                @if (profile()[item.key]) {
                  <span class="access-checkmark" aria-hidden="true">✓</span>
                }
              </label>
            </div>
          }
        </div>
      </fieldset>
      <button type="button" class="next-btn" (click)="submit()" aria-label="Continue">
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
      .access-fieldset {
        border: none;
        margin: 0;
        padding: 0;
      }
      .access-legend {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0 0 0.25rem;
      }
      .subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 0.75rem;
      }
      .accessibility-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .access-option {
        position: relative;
        min-height: 56px;
      }
      .access-checkbox {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
      }
      .access-checkbox:focus-visible + .access-label {
        outline: 3px solid var(--p-accent, #2563eb);
        outline-offset: 2px;
      }
      .access-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 500;
        text-align: left;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-fg, #1a1a1a);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        box-sizing: border-box;
      }
      .access-checkbox:checked + .access-label {
        border-color: #2563eb;
        background: #eff6ff;
        color: #1a1a1a;
      }
      .access-label:hover {
        border-color: #2563eb;
        background: #eff6ff;
      }
      .access-icon {
        font-size: 1.4rem;
        flex-shrink: 0;
      }
      .access-text {
        flex: 1;
      }
      .access-checkmark {
        flex-shrink: 0;
        font-size: 1.25rem;
        font-weight: 700;
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
    { key: 'chronicPain', i18nKey: 'toggle_chronicPain', icon: '😣' },
    { key: 'mobility', i18nKey: 'toggle_mobility', icon: '♿' },
    { key: 'sensory', i18nKey: 'toggle_sensory', icon: '🎧' },
    { key: 'cognitive', i18nKey: 'toggle_cognitive', icon: '🧠' },
    { key: 'alone', i18nKey: 'toggle_alone', icon: '👤' },
    { key: 'language', i18nKey: 'toggle_language', icon: '🌐' },
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
