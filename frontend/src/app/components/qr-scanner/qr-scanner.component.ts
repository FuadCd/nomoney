import {
  Component,
  output,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  signal,
  NgZone,
} from '@angular/core';
import { Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';

/** Valid intake URL pattern: /patient/intake/1?hospital=... */
function parseIntakeUrl(decodedText: string): { path: string; query: string } | null {
  try {
    const trimmed = decodedText.trim();
    if (!trimmed) return null;
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, window.location.origin);
    const path = url.pathname;
    const query = url.search || '';
    if (path.includes('/patient/intake/') && query.includes('hospital=')) {
      return { path, query };
    }
    return null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  template: `
    <div class="qr-scanner-overlay" (click)="onBackdropClick($event)">
      <div class="qr-scanner-modal" (click)="$event.stopPropagation()">
        <div class="qr-scanner-header">
          <h2 class="qr-scanner-title">Scan QR Code</h2>
          <p class="qr-scanner-subtitle">Point your camera at the patient check-in QR code</p>
          <button
            type="button"
            class="qr-scanner-close"
            (click)="close()"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="qr-scanner-body">
          @if (error()) {
            <div class="qr-scanner-error">
              <p>{{ error() }}</p>
            </div>
          }
          <div #scannerContainer class="qr-scanner-container"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .qr-scanner-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }
      .qr-scanner-modal {
        background: white;
        border-radius: 0.5rem;
        max-width:  min(400px, 100vw - 2rem);
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
      }
      .qr-scanner-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        position: relative;
      }
      .qr-scanner-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.25rem;
      }
      .qr-scanner-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }
      .qr-scanner-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #6b7280;
        border-radius: 0.375rem;
      }
      .qr-scanner-close:hover {
        background: #f3f4f6;
        color: #374151;
      }
      .qr-scanner-body {
        padding: 1rem;
        min-height: 280px;
      }
      .qr-scanner-container {
        width: 100%;
        min-height: 250px;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      .qr-scanner-error {
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.5rem;
        color: #991b1b;
        margin-bottom: 1rem;
      }
      #qr-reader {
        border: none !important;
      }
      #qr-reader__scan_region {
        background: #000 !important;
      }
    `,
  ],
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private ngZone = inject(NgZone);

  @ViewChild('scannerContainer', { read: ElementRef }) scannerContainer!: ElementRef<HTMLDivElement>;

  readonly closed = output<void>();
  readonly error = signal<string | null>(null);

  private scanner: Html5Qrcode | null = null;
  private readonly elementId = 'qr-reader-' + Math.random().toString(36).slice(2, 9);

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  close(): void {
    this.stopScanner();
    this.closed.emit();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('qr-scanner-overlay')) {
      this.close();
    }
  }

  private async startScanner(): Promise<void> {
    const container = this.scannerContainer?.nativeElement;
    if (!container) return;

    container.innerHTML = `<div id="${this.elementId}"></div>`;
    this.error.set(null);

    // Camera requires a secure context (HTTPS or localhost). Network IPs (e.g. http://192.168.x.x) won't prompt for permission.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      this.error.set(
        'Camera access requires a secure connection. Use https:// or test on the same machine at http://localhost. '
        + 'Accessing via http://192.168.x.x or similar will not work.'
      );
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      this.error.set(
        'Camera is not available in this browser or context. Use HTTPS or localhost to enable scanning.'
      );
      return;
    }

    try {
      this.scanner = new Html5Qrcode(this.elementId);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => this.onScanSuccess(decodedText),
        () => {}
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error.set(
        msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('permission')
          ? 'Camera access was denied. Please allow camera access to scan QR codes.'
          : msg.includes('NotFoundError') || msg.includes('DevicesNotFound')
            ? 'No camera found on this device.'
            : 'Could not start camera. Use HTTPS or localhost — camera access is blocked over insecure connections.'
      );
    }
  }

  private onScanSuccess(decodedText: string): void {
    const parsed = parseIntakeUrl(decodedText);
    if (parsed) {
      this.stopScanner();
      // html5-qrcode callback may run outside Angular zone; run inside so navigation takes effect
      this.ngZone.run(() => {
        this.router.navigateByUrl(parsed.path + parsed.query).finally(() => this.closed.emit());
      });
    }
  }

  private stopScanner(): void {
    if (this.scanner && this.scanner.isScanning) {
      this.scanner.stop().catch(() => {});
      this.scanner.clear();
      this.scanner = null;
    }
  }
}
