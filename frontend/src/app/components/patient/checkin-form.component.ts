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
    <!-- ─── Question 1: Discomfort (radio group) ─── -->
    @if (questionIndex() === 0) {
      <div class="question-screen fade-in">
        <fieldset class="checkin-fieldset">
          <legend class="checkin-legend">{{ i18n.t('checkinDiscomfort') }}</legend>
          <div class="discomfort-row">
            @for (level of discomfortLevels; track level.value) {
              <div class="discomfort-option">
                <input
                  type="radio"
                  [id]="'checkin-discomfort-' + level.value"
                  name="checkin-discomfort"
                  [value]="level.value"
                  [checked]="discomfort() === level.value"
                  (change)="selectDiscomfort(level.value)"
                  class="discomfort-radio"
                />
                <label [for]="'checkin-discomfort-' + level.value" class="discomfort-label-btn">
                  <span class="emoji" aria-hidden="true">{{ level.emoji }}</span>
                  <span class="label">{{ level.value }} {{ i18n.t('discomfort' + level.value) }}</span>
                </label>
              </div>
            }
          </div>
        </fieldset>
      </div>
    }

    <!-- ─── Question 2: Needs (checkboxes) ─── -->
    @if (questionIndex() === 1) {
      <div class="question-screen fade-in">
        <fieldset class="checkin-fieldset">
          <legend class="checkin-legend">{{ i18n.t('checkinNeeds') }}</legend>
          <div class="needs-options">
            @for (need of needOptions; track need.key) {
              <div class="need-option">
                <input
                  type="checkbox"
                  [id]="'checkin-need-' + need.key"
                  [checked]="selectedNeeds().has(need.key)"
                  (change)="toggleNeed(need.key)"
                  class="need-checkbox"
                />
                <label [for]="'checkin-need-' + need.key" class="need-label">
                  <span class="need-icon" aria-hidden="true">{{ need.icon }}</span>
                  <span class="need-text">{{ i18n.t(need.label) }}</span>
                  @if (selectedNeeds().has(need.key)) {
                    <span class="need-checkmark" aria-hidden="true">✓</span>
                  }
                </label>
              </div>
            }
          </div>
        </fieldset>
        <button type="button" class="continue-btn" (click)="confirmNeeds()" aria-label="Continue">
          {{ i18n.t('continue') }}
        </button>
      </div>
    }

    <!-- ─── Question 3: Planning to leave? (radio group) ─── -->
    @if (questionIndex() === 2) {
      <div class="question-screen fade-in">
        <fieldset class="checkin-fieldset">
          <legend class="checkin-legend">{{ i18n.t('checkinLeave') }}</legend>
          <div class="leave-options">
            <div class="leave-option">
              <input
                type="radio"
                id="checkin-leave-staying"
                name="checkin-leave"
                value="staying"
                [checked]="planningToLeave() === 'staying'"
                (change)="onLeaveChange($event)"
                class="leave-radio"
              />
              <label for="checkin-leave-staying" class="leave-label staying">{{ i18n.t('leaveStaying') }}</label>
            </div>
            <div class="leave-option">
              <input
                type="radio"
                id="checkin-leave-unsure"
                name="checkin-leave"
                value="unsure"
                [checked]="planningToLeave() === 'unsure'"
                (change)="onLeaveChange($event)"
                class="leave-radio"
              />
              <label for="checkin-leave-unsure" class="leave-label unsure">{{ i18n.t('leaveUnsure') }}</label>
            </div>
            <div class="leave-option">
              <input
                type="radio"
                id="checkin-leave-leaving"
                name="checkin-leave"
                value="leaving"
                [checked]="planningToLeave() === 'leaving'"
                (change)="onLeaveChange($event)"
                class="leave-radio"
              />
              <label for="checkin-leave-leaving" class="leave-label leaving">{{ i18n.t('leaveThinking') }}</label>
            </div>
          </div>
        </fieldset>
      </div>
    }

    <!-- ─── Thank you screen ─── -->
    @if (questionIndex() === 3) {
      <div class="question-screen thank-you fade-in">
        <div class="ty-icon" aria-hidden="true">💚</div>
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

      .checkin-fieldset {
        border: none;
        margin: 0;
        padding: 0;
      }
      .checkin-legend {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--p-fg, #1a1a1a);
        margin-bottom: 0.75rem;
      }

      /* Discomfort — radio group, horizontal */
      .discomfort-row {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      .discomfort-option {
        position: relative;
        flex: 1;
        min-width: 56px;
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
      .discomfort-radio:focus-visible + .discomfort-label-btn {
        outline: 3px solid var(--p-accent, #2563eb);
        outline-offset: 2px;
      }
      .discomfort-label-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        min-height: 80px;
        border: 2px solid #2563eb;
        border-radius: 14px;
        background: var(--p-card-bg, white);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        box-sizing: border-box;
      }
      .discomfort-radio:checked + .discomfort-label-btn {
        background: #eff6ff;
        color: #2563eb;
      }
      .discomfort-label-btn .emoji {
        font-size: 1.8rem;
      }
      .discomfort-label-btn .label {
        font-size: 0.75rem;
        font-weight: 700;
      }

      /* Needs — checkboxes */
      .needs-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .need-option {
        position: relative;
        min-height: 56px;
      }
      .need-checkbox {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
      }
      .need-checkbox:focus-visible + .need-label {
        outline: 3px solid var(--p-accent, #2563eb);
        outline-offset: 2px;
      }
      .need-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
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
        transition: border-color 0.15s, background 0.15s;
        box-sizing: border-box;
      }
      .need-checkbox:checked + .need-label {
        border-color: #2563eb;
        background: #eff6ff;
      }
      .need-icon {
        font-size: 1.3rem;
      }
      .need-text {
        flex: 1;
      }
      .need-checkmark {
        font-size: 1.25rem;
        font-weight: 700;
        color: #2563eb;
      }
      .continue-btn {
        width: 100%;
        min-height: 56px;
        margin-top: 0.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        border: none;
        border-radius: 12px;
        background: #2563eb;
        color: var(--p-accent-fg, white);
        cursor: pointer;
        transition: opacity 0.1s;
      }
      .continue-btn:active {
        opacity: 0.9;
      }

      /* Leave — radio group */
      .leave-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .leave-option {
        position: relative;
        min-height: 56px;
      }
      .leave-radio {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
      }
      .leave-radio:focus-visible + .leave-label {
        outline: 3px solid var(--p-fg, #1a1a1a);
        outline-offset: 2px;
      }
      .leave-label {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 80px;
        font-size: 1.2rem;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.1s;
        box-sizing: border-box;
      }
      .leave-label:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      .leave-label.staying {
        background: var(--p-green, #2e7d32);
        color: white;
      }
      .leave-label.unsure {
        background: #f57f17;
        color: white;
      }
      .leave-label.leaving {
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
  readonly discomfort = signal(1);
  readonly selectedNeeds = signal<Set<string>>(new Set());
  readonly planningToLeave = signal<'staying' | 'unsure' | 'leaving' | null>(null);
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
    this.discomfort.set(value);
    this.questionIndex.set(1);
  }

  onLeaveChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value as 'staying' | 'unsure' | 'leaving';
    this.planningToLeave.set(value);
    this.selectLeave(value);
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
    this.questionIndex.set(3);
    const result: CheckInFormResult = {
      discomfort: this.discomfort(),
      needs: this.needs,
      planningToLeave: choice,
    };
    setTimeout(() => this.completed.emit(result), 5000);
  }
}
