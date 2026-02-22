import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../patient.component';
import { CheckInService } from '../../../core/services/check-in.service';
import {
  CheckInFormComponent,
  CheckInFormResult,
} from '../../../components/patient/checkin-form.component';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CheckInFormComponent],
  template: `
    <main class="checkin-page p-4">
      <button type="button" class="back-link back-btn mb-6" (click)="back()" aria-label="Back to waiting page">&larr; Back</button>
      <div class="checkin-card">
        <app-checkin-form (completed)="onComplete($event)" />
      </div>
    </main>
  `,
  styles: [
    `
      .checkin-page {
        max-width: 672px;
        margin: 0 auto;
        padding-left: env(safe-area-inset-left, 0);
        padding-right: env(safe-area-inset-right, 0);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .checkin-card {
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        padding: 1rem;
      }
      @media (min-width: 640px) {
        .checkin-card { padding: 1.5rem; }
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        color: var(--p-accent, #2563eb);
        text-decoration: none;
        font-size: 0.875rem;
      }
      .back-link:hover { text-decoration: underline; }
      .back-btn { background: none; border: none; padding: 0.5rem 0; font: inherit; cursor: pointer; }
    `,
  ],
})
export class CheckinComponent {
  private readonly router = inject(Router);
  private readonly checkInService = inject(CheckInService);
  readonly i18n = inject(I18nService);

  /** Back: after check-in flow, return to home. */
  back(): void {
    this.router.navigate(['/']);
  }

  onComplete(result: CheckInFormResult): void {
    const patientId =
      typeof sessionStorage !== 'undefined'
        ? (sessionStorage.getItem('patient_id') ?? 'unknown')
        : 'unknown';

    const assistanceRequested = this.mapNeedsToBackend(result.needs);
    const intendsToStay = result.planningToLeave !== 'leaving';

    this.checkInService
      .submitCheckIn({
        passportId: patientId,
        discomfortLevel: result.discomfort,
        assistanceRequested: assistanceRequested.length ? assistanceRequested : undefined,
        intendsToStay,
        planningToLeaveChoice: result.planningToLeave,
        timestamp: new Date().toISOString(),
      })
      .subscribe({
        next: () => this.router.navigate(['/patient/waiting']),
        error: () => this.router.navigate(['/patient/waiting']),
      });
  }

  /** Map form need keys to backend assistanceRequested values. */
  private mapNeedsToBackend(needs: string[]): string[] {
    const filtered = needs.filter((k) => k !== 'none');
    return filtered.map((k) => (k === 'quiet' ? 'quiet-space' : k));
  }
}
