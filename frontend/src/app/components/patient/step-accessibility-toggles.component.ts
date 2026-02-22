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
    <div class="step" role="group" aria-labelledby="accessibility-step-title">
      <h2 id="accessibility-step-title" class="title">{{ i18n.t('accessibilityTitle') }}</h2>
      <p class="subtitle">{{ i18n.t('accessibilitySubtitle') }}</p>
      <div class="accessibility-buttons">
        @for (item of toggles; track item.key) {
          <button
            type="button"
            class="access-btn"
            [class.selected]="profile()[item.key]"
            (click)="toggle(item.key)"
            [attr.aria-label]="i18n.t(item.i18nKey)"
            [attr.aria-pressed]="profile()[item.key]"
          >
            <span class="access-icon">{{ item.icon }}</span>
            {{ i18n.t(item.i18nKey) }}
          </button>
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
      .subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: -0.5rem 0 0;
      }
      .accessibility-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .access-btn {
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
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: border-color 0.15s, background 0.15s;
      }
      .access-btn.selected {
        border-color: #2563eb;
        background: #eff6ff;
        color: #2563eb;
      }
      .access-icon {
        font-size: 1.4rem;
        flex-shrink: 0;
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
