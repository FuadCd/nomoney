import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../patient.component';
import { CheckInService } from '../../../core/services/check-in.service';
import { PatientStoreService } from '../../../core/patient-store.service';
import {
  CheckInFormComponent,
  CheckInFormResult,
} from '../../../components/patient/checkin-form.component';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CheckInFormComponent],
  template: `
    <div class="checkin-page">
      <button type="button" class="back-link back-btn" (click)="back()">&larr; Back</button>
      <app-checkin-form (completed)="onComplete($event)" />
    </div>
  `,
  styles: [
    `
      .checkin-page {
        padding: 0.5rem 0;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
        color: var(--p-accent, #0d47a1);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .back-btn {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
      }
    `,
  ],
})
export class CheckinComponent {
  private readonly router = inject(Router);
  private readonly checkInService = inject(CheckInService);
  private readonly store = inject(PatientStoreService);
  readonly i18n = inject(I18nService);

  /** Back: previous in session sequence is Waiting. */
  back(): void {
    this.router.navigate(['/patient/waiting']);
  }

  onComplete(result: CheckInFormResult): void {
    const patientId =
      typeof sessionStorage !== 'undefined'
        ? (sessionStorage.getItem('patient_id') ?? 'unknown')
        : 'unknown';

    const assistanceRequested = this.mapNeedsToBackend(result.needs);
    const intendsToStay = result.planningToLeave !== 'leaving';
    const timestamp = new Date().toISOString();

    const checkInPayload = {
      discomfort: result.discomfort,
      needsHelp: result.needs.length > 0 && !result.needs.includes('none'),
      planningToLeave: result.planningToLeave === 'leaving',
      timestamp: Date.now(),
    };

    this.checkInService
      .submitCheckIn({
        passportId: patientId,
        discomfortLevel: result.discomfort,
        assistanceRequested: assistanceRequested.length ? assistanceRequested : undefined,
        intendsToStay,
        timestamp,
      })
      .subscribe({
        next: () => {
          this.store.addCheckIn(patientId, checkInPayload);
          this.router.navigate(['/patient/waiting']);
        },
        error: () => {
          this.store.addCheckIn(patientId, checkInPayload);
          this.router.navigate(['/patient/waiting']);
        },
      });
  }

  /** Map form need keys to backend assistanceRequested values. */
  private mapNeedsToBackend(needs: string[]): string[] {
    const filtered = needs.filter((k) => k !== 'none');
    return filtered.map((k) => (k === 'quiet' ? 'quiet-space' : k));
  }
}
