import { Component, signal, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { I18nService, IntakeAccessibilityProfile } from '../patient.component';
import { StepContextRiskComponent, ContextRiskResult } from '../../../components/patient/step-context-risk.component';
import { StepAccessibilityTogglesComponent } from '../../../components/patient/step-accessibility-toggles.component';
import { StepConfirmComponent } from '../../../components/patient/step-confirm.component';

@Component({
  selector: 'app-intake',
  standalone: true,
  imports: [
    StepContextRiskComponent,
    StepAccessibilityTogglesComponent,
    StepConfirmComponent,
  ],
  template: `
    <main class="intake p-4">
      <div class="mb-8 text-center">
        <p class="text-gray-600 text-sm" aria-live="polite">{{ i18n.t('stepXof3', { step: stepParam().toString() }) }}</p>
      </div>
      <div class="intake-card">
        <button type="button" class="back-link back-btn mb-4" (click)="back()" aria-label="Back to previous step">&larr; Back</button>
        <div class="progress-bar mb-6" role="progressbar" [attr.aria-valuenow]="stepParam()" aria-valuemin="1" aria-valuemax="3" [attr.aria-label]="'Step ' + stepParam() + ' of 3'">
          <div class="progress-fill" [style.width.%]="(stepParam() / 3) * 100"></div>
        </div>

        @switch (stepParam()) {
        @case (1) {
          <div class="fade-in">
            <app-step-context-risk
              [initialHospitalKey]="initialHospitalFromQuery()"
              (completed)="onContextRiskDone($event)"
            />
          </div>
        }
        @case (2) {
          <div class="fade-in">
            <app-step-accessibility-toggles (completed)="onAccessibilityDone($event)" />
          </div>
        }
        @case (3) {
          <div class="fade-in">
            <app-step-confirm
              [hospitalKey]="hospitalKey()"
              [discomfortLevel]="discomfortLevel()"
              [accessibilityProfile]="accessibilityProfile()"
              [anonymousId]="anonymousId"
            />
          </div>
        }
      }
      </div>
    </main>
  `,
  styles: [
    `
      .intake {
        min-height: 100%;
        padding-left: env(safe-area-inset-left, 0);
        padding-right: env(safe-area-inset-right, 0);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .intake-card {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        padding: 1rem;
      }
      @media (min-width: 640px) {
        .intake-card { padding: 1.5rem; }
      }
      .back-link {
        display: inline-block;
        color: var(--p-accent, #2563eb);
        text-decoration: none;
        font-size: 0.875rem;
      }
      .back-link:hover { text-decoration: underline; }
      .back-btn {
        background: none;
        border: none;
        padding: 0.5rem 0;
        font: inherit;
        cursor: pointer;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
      }
      .progress-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--p-accent, #2563eb);
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  readonly stepParam = toSignal(
    this.route.paramMap.pipe(map((p) => Math.min(3, Math.max(1, +(p.get('step') ?? 1) || 1)))),
    { initialValue: 1 }
  );
  readonly initialHospitalFromQuery = toSignal(
    this.route.queryParamMap.pipe(
      map((q) => {
        const h = q.get('hospital');
        if (!h || typeof h !== 'string') return undefined;
        const valid = ['uofa', 'royalAlexandra', 'greyNuns', 'misericordia', 'sturgeon'];
        return valid.includes(h) ? h : undefined;
      })
    ),
    { initialValue: undefined as string | undefined }
  );
  readonly hospitalKey = signal<string>('');
  readonly discomfortLevel = signal(1);
  readonly accessibilityProfile = signal<IntakeAccessibilityProfile>({
    chronicPain: false,
    mobility: false,
    sensory: false,
    cognitive: false,
    alone: false,
    language: false,
  });
  readonly anonymousId = Math.random().toString(36).substring(2, 10).toUpperCase();

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('patient_id', this.anonymousId);
    }
    effect(() => {
      if (this.initialHospitalFromQuery()) {
        this.auth.setPatientSession();
      }
    });
  }

  onContextRiskDone(data: ContextRiskResult): void {
    this.hospitalKey.set(data.hospitalKey);
    this.discomfortLevel.set(data.discomfortLevel);
    this.router.navigate(['/patient/intake/2']);
    window.scrollTo(0, 0);
  }

  onAccessibilityDone(profile: IntakeAccessibilityProfile): void {
    this.accessibilityProfile.set(profile);
    this.router.navigate(['/patient/intake/3']);
    window.scrollTo(0, 0);
  }

  /** Back follows session sequence: step 1 → landing; step 2 → 1; step 3 → 2. */
  back(): void {
    const step = this.stepParam();
    if (step === 1) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/patient/intake', step - 1]);
    }
  }
}
