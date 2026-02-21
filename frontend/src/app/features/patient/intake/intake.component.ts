import { Component, signal, inject } from '@angular/core';
import { I18nService, IntakeAccessibilityProfile } from '../patient.component';
import { StepComplaintComponent } from '../../../components/patient/step-complaint.component';
import { StepAccessibilityComponent } from '../../../components/patient/step-accessibility.component';
import { StepConfirmComponent } from '../../../components/patient/step-confirm.component';

@Component({
  selector: 'app-intake',
  standalone: true,
  imports: [StepComplaintComponent, StepAccessibilityComponent, StepConfirmComponent],
  template: `
    <div class="intake">
      <div
        class="progress"
        role="progressbar"
        [attr.aria-valuenow]="step()"
        aria-valuemin="1"
        aria-valuemax="3"
      >
        {{ i18n.t('stepXof3', { step: step().toString() }) }}
      </div>
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="(step() / 3) * 100"></div>
      </div>

      @switch (step()) {
        @case (1) {
          <div class="fade-in">
            <app-step-complaint [useEmojiSeverity]="false" (completed)="onComplaintDone($event)" />
          </div>
        }
        @case (2) {
          <div class="fade-in">
            <app-step-accessibility (completed)="onAccessibilityDone($event)" />
          </div>
        }
        @case (3) {
          <div class="fade-in">
            <app-step-confirm
              [complaint]="complaint()"
              [severity]="severity()"
              [accessibilityProfile]="accessibilityProfile()"
              [anonymousId]="anonymousId"
            />
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .intake {
        padding: 0.5rem 0;
      }
      .progress {
        text-align: center;
        font-weight: 600;
        color: var(--p-accent, #0d47a1);
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
      }
      .progress-bar {
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
        margin-bottom: 1.5rem;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--p-accent, #0d47a1);
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      .fade-in {
        animation: fadeSlide 0.3s ease-out;
      }
      @keyframes fadeSlide {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class IntakeComponent {
  readonly i18n = inject(I18nService);
  readonly step = signal(1);
  readonly complaint = signal('');
  readonly severity = signal(1);
  readonly accessibilityProfile = signal<IntakeAccessibilityProfile>({
    mobility: false,
    sensory: false,
    chronicPain: false,
    cognitive: false,
    language: false,
    supportPerson: false,
  });
  readonly anonymousId = Math.random().toString(36).substring(2, 10).toUpperCase();

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('patient_id', this.anonymousId);
    }
  }

  onComplaintDone(data: { complaint: string; severity: number }): void {
    this.complaint.set(data.complaint);
    this.severity.set(data.severity);
    this.step.set(2);
    window.scrollTo(0, 0);
  }

  onAccessibilityDone(profile: IntakeAccessibilityProfile): void {
    this.accessibilityProfile.set(profile);
    this.step.set(3);
    window.scrollTo(0, 0);
  }
}
