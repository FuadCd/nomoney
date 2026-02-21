import { Component, output, signal, inject } from '@angular/core';
import { I18nService } from '../../features/patient/patient.component';

export interface CheckInFormResult {
  discomfort: number;
  needs: string[];
  planningToLeave: 'staying' | 'unsure' | 'leaving';
}

@Component({
  selector: 'app-checkin-form',
  standalone: true,
  template: `
    <!-- ─── Question 1: Discomfort ─── -->
    @if (questionIndex() === 0) {
      <div class="question-screen fade-in">
        <h2 class="question">{{ i18n.t('checkinDiscomfort') }}</h2>
        <div class="discomfort-buttons">
          @for (level of discomfortLevels; track level.value) {
            <button
              class="discomfort-btn"
              (click)="selectDiscomfort(level.value)"
              [attr.aria-label]="'Discomfort level ' + level.value"
            >
              <span class="emoji">{{ level.emoji }}</span>
              <span class="label">{{ level.value }}</span>
            </button>
          }
        </div>
      </div>
    }

    <!-- ─── Question 2: Needs (multi-select) ─── -->
    @if (questionIndex() === 1) {
      <div class="question-screen fade-in">
        <h2 class="question">{{ i18n.t('checkinNeeds') }}</h2>
        <div class="needs-buttons">
          @for (need of needOptions; track need.key) {
            <button
              class="need-btn"
              [class.selected]="selectedNeeds().has(need.key)"
              (click)="toggleNeed(need.key)"
              [attr.aria-label]="i18n.t(need.label)"
              [attr.aria-pressed]="selectedNeeds().has(need.key)"
            >
              <span class="need-icon">{{ need.icon }}</span>
              {{ i18n.t(need.label) }}
            </button>
          }
        </div>
        <button class="continue-btn" (click)="confirmNeeds()" aria-label="Continue">→</button>
      </div>
    }

    <!-- ─── Question 3: Planning to leave? ─── -->
    @if (questionIndex() === 2) {
      <div class="question-screen fade-in">
        <h2 class="question">{{ i18n.t('checkinLeave') }}</h2>
        <div class="leave-buttons">
          <button
            class="leave-btn staying"
            (click)="selectLeave('staying')"
            [attr.aria-label]="i18n.t('leaveStaying')"
          >
            {{ i18n.t('leaveStaying') }}
          </button>
          <button
            class="leave-btn unsure"
            (click)="selectLeave('unsure')"
            [attr.aria-label]="i18n.t('leaveUnsure')"
          >
            {{ i18n.t('leaveUnsure') }}
          </button>
          <button
            class="leave-btn leaving"
            (click)="selectLeave('leaving')"
            [attr.aria-label]="i18n.t('leaveThinking')"
          >
            {{ i18n.t('leaveThinking') }}
          </button>
        </div>
      </div>
    }

    <!-- ─── Thank you screen ─── -->
    @if (questionIndex() === 3) {
      <div class="question-screen thank-you fade-in">
        <div class="ty-icon">💚</div>
        <h2>{{ i18n.t('thankYou') }}</h2>
        <p>{{ i18n.t('thankYouMessage') }}</p>
        <p class="returning">{{ i18n.t('returnToWaiting') }}</p>
      </div>
    }
  `,
  styles: [
    `
      .question-screen {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      .fade-in {
        animation: fadeSlide 0.25s ease-out;
      }
      @keyframes fadeSlide {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .question {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin: 0;
        line-height: 1.4;
      }

      /* Discomfort buttons — horizontal row */
      .discomfort-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      .discomfort-btn {
        flex: 1;
        min-height: 80px;
        min-width: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        border: 2px solid var(--p-accent, #0d47a1);
        border-radius: 14px;
        background: var(--p-card-bg, white);
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s,
          transform 0.1s;
      }
      .discomfort-btn:active {
        transform: scale(0.95);
      }
      .discomfort-btn .emoji {
        font-size: 1.8rem;
      }
      .discomfort-btn .label {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--p-accent, #0d47a1);
      }

      /* Needs buttons */
      .needs-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .need-btn {
        width: 100%;
        min-height: 56px;
        padding: 0.75rem 1rem;
        font-size: 1.05rem;
        font-weight: 600;
        border: 2px solid var(--p-border, #bbb);
        border-radius: 12px;
        background: var(--p-card-bg, white);
        color: var(--p-fg, #1a1a1a);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition:
          border-color 0.15s,
          background 0.15s;
      }
      .need-btn.selected {
        border-color: var(--p-accent, #0d47a1);
        background: var(--p-light-accent, #e3f2fd);
        color: var(--p-accent, #0d47a1);
      }
      .need-icon {
        font-size: 1.3rem;
      }
      .continue-btn {
        align-self: flex-end;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: var(--p-accent, #0d47a1);
        color: var(--p-accent-fg, white);
        font-size: 1.8rem;
        cursor: pointer;
        transition: transform 0.1s;
      }
      .continue-btn:active {
        transform: scale(0.93);
      }

      /* Leave buttons */
      .leave-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .leave-btn {
        width: 100%;
        min-height: 80px;
        font-size: 1.2rem;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition:
          transform 0.1s,
          opacity 0.1s;
      }
      .leave-btn:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      .staying {
        background: var(--p-green, #2e7d32);
        color: white;
      }
      .unsure {
        background: #f57f17;
        color: white;
      }
      .leaving {
        background: var(--p-red, #c62828);
        color: white;
      }

      /* Thank you */
      .thank-you {
        padding: 2rem 0;
      }
      .ty-icon {
        font-size: 3rem;
      }
      .thank-you h2 {
        font-size: 1.5rem;
        color: var(--p-green, #2e7d32);
        margin: 0;
      }
      .thank-you p {
        color: var(--p-muted, #555);
        font-size: 1.1rem;
        margin: 0.5rem 0 0;
      }
      .returning {
        font-size: 0.9rem;
        color: #999;
        margin-top: 1rem !important;
      }
    `,
  ],
})
export class CheckInFormComponent {
  readonly completed = output<CheckInFormResult>();
  readonly i18n = inject(I18nService);

  readonly questionIndex = signal(0);
  private discomfort = 1;
  readonly selectedNeeds = signal<Set<string>>(new Set());
  private needs: string[] = [];

  readonly discomfortLevels = [
    { value: 1, emoji: '🙂' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😣' },
    { value: 4, emoji: '😫' },
    { value: 5, emoji: '🆘' },
  ];

  readonly needOptions = [
    { key: 'interpreter', label: 'needInterpreter', icon: '🌐' },
    { key: 'quiet', label: 'needQuietSpace', icon: '🤫' },
    { key: 'info', label: 'needInfo', icon: 'ℹ️' },
    { key: 'mobility', label: 'needMobility', icon: '♿' },
    { key: 'none', label: 'needNone', icon: '✓' },
  ];

  selectDiscomfort(value: number): void {
    this.discomfort = value;
    this.questionIndex.set(1);
  }

  toggleNeed(key: string): void {
    const current = new Set(this.selectedNeeds());
    if (key === 'none') {
      current.clear();
      current.add('none');
    } else {
      current.delete('none');
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }
    }
    this.selectedNeeds.set(current);
  }

  confirmNeeds(): void {
    this.needs = [...this.selectedNeeds()];
    this.questionIndex.set(2);
  }

  selectLeave(choice: 'staying' | 'unsure' | 'leaving'): void {
    // Show thank-you, then emit after 5 seconds
    this.questionIndex.set(3);
    const result: CheckInFormResult = {
      discomfort: this.discomfort,
      needs: this.needs,
      planningToLeave: choice,
    };
    setTimeout(() => this.completed.emit(result), 5000);
  }
}
