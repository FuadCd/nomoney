import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="landing-wrap">
      <div class="landing-inner">
        <div class="landing-card">
          <div class="flex items-center justify-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <h1 class="text-2xl font-bold text-gray-900">AccessER</h1>
          </div>
          <p class="text-sm text-gray-600 text-center mb-6">Accessibility-Adjusted Emergency Room Burden</p>

          <div class="space-y-3">
            <input
              id="hospital-code"
              type="text"
              [(ngModel)]="hospitalCode"
              placeholder="Hospital Code"
              aria-label="Hospital code"
              (keydown.enter)="submitCode()"
              class="landing-input"
            />
            <button
              type="button"
              (click)="submitCode()"
              class="landing-btn landing-btn-staff"
            >
              Staff access
            </button>
            @if (codeError) {
              <p class="text-sm text-red-600">{{ codeError }}</p>
            }
          </div>

          <div class="flex items-center gap-4 my-6">
            <span class="flex-1 h-px bg-gray-200"></span>
            <span class="text-sm text-gray-500">or</span>
            <span class="flex-1 h-px bg-gray-200"></span>
          </div>

          <button
            type="button"
            (click)="goAsPatient()"
            class="landing-btn landing-btn-patient"
          >
            I'm a patient
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .landing-wrap {
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        padding-left: calc(16px + env(safe-area-inset-left, 0));
        padding-right: calc(16px + env(safe-area-inset-right, 0));
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
        background-color: #f9fafb;
      }
      .landing-inner {
        width: 100%;
        max-width: 28rem;
      }
      .landing-card {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
      }
      @media (min-width: 640px) {
        .landing-card { padding: 2rem; }
      }
      .landing-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 16px;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        box-sizing: border-box;
      }
      .landing-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
      }
      .landing-btn {
        width: 100%;
        min-height: 48px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        transition: background 0.15s;
      }
      .landing-btn-staff {
        background: #2563eb;
        color: white;
      }
      .landing-btn-staff:hover { background: #1d4ed8; }
      .landing-btn-patient {
        background: #16a34a;
        color: white;
      }
      .landing-btn-patient:hover { background: #15803d; }
    `,
  ],
})
export class LandingComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  hospitalCode = '';
  codeError = '';

  submitCode(): void {
    this.codeError = '';
    const raw = this.hospitalCode.trim();
    if (!raw) {
      this.codeError = 'Invalid Code.';
      return;
    }
    if (this.auth.setStaffSession(raw)) {
      this.router.navigate(['/staff']);
    } else {
      this.codeError = 'Invalid Code.';
    }
  }

  goAsPatient(): void {
    this.auth.setPatientSession();
    this.router.navigate(['/patient']);
  }
}
