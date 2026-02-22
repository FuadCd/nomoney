import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ClientInfoService } from '../../core/services/client-info.service';
import { QrScannerComponent } from '../../components/qr-scanner/qr-scanner.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule, QrScannerComponent],
  template: `
    <main class="landing-wrap">
      <div class="landing-inner">
        <div class="landing-card">
          <header class="landing-header">
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <h1 class="text-2xl font-bold text-gray-900">AccessER</h1>
            </div>
            <p class="text-sm text-gray-600 text-center mb-6">Accessibility-Adjusted Emergency Room Burden</p>
          </header>

          <div class="space-y-3">
            <input
              id="hospital-code"
              type="text"
              [(ngModel)]="hospitalCode"
              placeholder="Hospital code"
              aria-label="Hospital code"
              [attr.aria-describedby]="codeError ? 'hospital-code-error' : null"
              [attr.aria-invalid]="!!codeError"
              (keydown.enter)="submitCode()"
              class="landing-input"
            />
            @if (codeError) {
              <p id="hospital-code-error" class="text-sm text-red-600 landing-error" role="alert">{{ codeError }}</p>
            }
            <button
              type="button"
              (click)="submitCode()"
              class="landing-btn landing-btn-staff"
            >
              Staff access
            </button>
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

          <button
            type="button"
            (click)="openQrScanner()"
            class="landing-btn landing-btn-scan mt-3"
          >
            Scan QR Code
          </button>

          <div class="landing-network mt-6 pt-4 border-t border-gray-200">
            <p class="landing-network-label">Local</p>
            <p class="landing-network-value">{{ localUrl() }}</p>
            <p class="landing-network-label mt-2">Network</p>
            <p class="landing-network-value">{{ networkUrl() }}</p>
          </div>
        </div>
      </div>

      @if (showQrScanner()) {
        <app-qr-scanner (closed)="closeQrScanner()" />
      }
    </main>
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
        border-color: #3b82f6;
      }
      .landing-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      .landing-error {
        margin: 0.25rem 0 0;
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
      .landing-btn-scan {
        background: transparent;
        color: #2563eb;
        border: 2px solid #2563eb;
      }
      .landing-btn-scan:hover { background: #eff6ff; }
      .landing-network { font-size: 0.8125rem; color: #6b7280; }
      .landing-network-label { font-weight: 600; margin: 0; color: #374151; }
      .landing-network-value { margin: 0.25rem 0 0; word-break: break-all; }
    `,
  ],
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private clientInfo = inject(ClientInfoService);

  hospitalCode = '';
  codeError = '';
  showQrScanner = signal(false);
  localUrl = signal('');
  networkUrl = signal('—');

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.localUrl.set(window.location.origin);
    }
    this.clientInfo.getClientIp().subscribe((ip) => {
      if (ip && typeof window !== 'undefined') {
        const port = window.location.port || '4200';
        this.networkUrl.set(`http://${ip}:${port}`);
      } else {
        this.networkUrl.set('—');
      }
    });
  }

  openQrScanner(): void {
    this.showQrScanner.set(true);
  }

  closeQrScanner(): void {
    this.showQrScanner.set(false);
  }

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
