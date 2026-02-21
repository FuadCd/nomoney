import { Component, input, output, signal, inject } from '@angular/core';
import { I18nService } from '../../features/patient/patient.component';

@Component({
  selector: 'app-step-complaint',
  standalone: true,
  template: `
    <div class="step">
      <h2 class="question">{{ i18n.t('complaintQuestion') }}</h2>
      <textarea
        class="complaint-input"
        [placeholder]="i18n.t('complaintPlaceholder')"
        [value]="complaint()"
        (input)="onInput($event)"
        rows="3"
        aria-label="Chief complaint"
      ></textarea>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <h2 class="question severity-q">{{ i18n.t('severityQuestion') }}</h2>
      <div class="severity-buttons">
        @for (level of levels; track level.value) {
          <button
            class="severity-btn"
            (click)="selectSeverity(level.value)"
            [attr.aria-label]="'Severity ' + level.value"
          >
            @if (useEmojiSeverity()) {
              <span class="emoji">{{ level.emoji }}</span>
            } @else {
              {{ i18n.t('severity' + level.value) }}
            }
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
      .severity-q {
        margin-top: 0.5rem;
      }
      .complaint-input {
        width: 100%;
        min-height: 80px;
        padding: 1rem;
        font-size: 1.1rem;
        border: 2px solid var(--p-border, #bbb);
        border-radius: 12px;
        resize: vertical;
        font-family: inherit;
        box-sizing: border-box;
        background: var(--p-input-bg, white);
        color: var(--p-fg, #1a1a1a);
      }
      .complaint-input:focus {
        border-color: var(--p-accent, #0d47a1);
        outline: none;
      }
      .error {
        color: var(--p-red, #c62828);
        font-weight: 500;
        margin: 0;
        font-size: 0.95rem;
      }
      .severity-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .severity-btn {
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1.1rem;
        font-weight: 600;
        border: 2px solid var(--p-accent, #0d47a1);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-accent, #0d47a1);
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
      }
      .severity-btn:active,
      .severity-btn:hover {
        background: var(--p-accent, #0d47a1);
        color: var(--p-accent-fg, white);
      }
      .emoji {
        font-size: 1.8rem;
      }
    `,
  ],
})
export class StepComplaintComponent {
  readonly useEmojiSeverity = input(false);
  readonly completed = output<{ complaint: string; severity: number }>();
  readonly i18n = inject(I18nService);

  readonly complaint = signal('');
  readonly error = signal('');

  readonly levels = [
    { value: 1, emoji: '🙂' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😣' },
    { value: 4, emoji: '😫' },
    { value: 5, emoji: '🆘' },
  ];

  onInput(event: Event): void {
    this.complaint.set((event.target as HTMLTextAreaElement).value);
    if (this.complaint().trim()) this.error.set('');
  }

  selectSeverity(value: number): void {
    if (!this.complaint().trim()) {
      this.error.set(this.i18n.t('errorComplaintRequired'));
      return;
    }
    this.completed.emit({ complaint: this.complaint().trim(), severity: value });
  }
}
