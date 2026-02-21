import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="landing">
      <div class="card">
        <h1>AccessER</h1>
        <p class="tagline">Accessibility-Adjusted Emergency Room Burden</p>

        <div class="staff-entry">
          <input
            id="hospital-code"
            type="text"
            [(ngModel)]="hospitalCode"
            placeholder="Hospital Code"
            aria-label="Hospital code"
            (keydown.enter)="submitCode()"
          />
          <button type="button" class="btn-primary" (click)="submitCode()">
            Staff access
          </button>
          @if (codeError) {
            <p class="error">{{ codeError }}</p>
          }
        </div>

        <div class="divider">
          <span>or</span>
        </div>

        <button type="button" class="btn-patient" (click)="goAsPatient()">
          I'm a patient
        </button>
      </div>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .card h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #0d47a1; }
    .tagline { margin: 0 0 1.5rem; color: #666; font-size: 0.9rem; }
    .staff-entry { display: flex; flex-direction: column; gap: 0.5rem; }
    .staff-entry label { font-size: 0.85rem; font-weight: 600; color: #333; }
    .staff-entry input {
      padding: 0.6rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 1rem;
    }
    .staff-entry input:focus {
      outline: none;
      border-color: #1565c0;
      box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.2);
    }
    .btn-primary {
      padding: 0.6rem 1rem;
      background: #1565c0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover { background: #0d47a1; }
    .error { margin: 0.25rem 0 0; color: #c62828; font-size: 0.85rem; }
    .divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #ddd; }
    .divider span { color: #888; font-size: 0.85rem; }
    .btn-patient {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      background: #2e7d32;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-patient:hover { background: #1b5e20; }
  `],
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
