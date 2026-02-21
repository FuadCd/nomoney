import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { PatientStoreService } from '../../core/patient-store.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, DecimalPipe],
  template: `
    <div class="staff-layout">
      <header class="header">
        <h1>AccessER Staff Dashboard</h1>
        <p class="subtitle">Real-Time Burden Monitoring</p>
      </header>
      <main class="content">
        <p class="placeholder">Staff dashboard with Queue Equity View, patient risk indicators, and suggested actions.</p>

        <section class="store-integration" aria-label="Queue from store (P2 integration)">
          <h2>Queue ({{ (patients$ | async)?.length ?? 0 }} patients)</h2>
          <ul class="patient-list">
            @for (p of (patients$ | async); track p.id) {
              <li class="patient-row" [class.missed]="p.missedCheckIn">
                <span class="id">{{ p.id }}</span>
                <span class="burden">Burden: {{ p.burdenIndex | number:'1.0-0' }}</span>
                <span class="alert" [attr.data-alert]="p.alertLevel">{{ p.alertLevel }}</span>
                @if (p.missedCheckIn) {
                  <span class="badge">Missed check-in</span>
                }
              </li>
            } @empty {
              <li class="empty">No patients. Use Demo: Seed data below.</li>
            }
          </ul>
        </section>

        <section class="demo-controls" aria-label="Demo data and time-skip (P2)">
          <h2>Demo</h2>
          <p class="demo-hint">Seed patients and advance time to see burden/alert changes.</p>
          <div class="demo-buttons">
            <button type="button" (click)="seedDemo()">Seed demo data</button>
            <button type="button" (click)="advance15()">+15 min</button>
            <button type="button" (click)="resetTime()">Reset time</button>
          </div>
        </section>
      </main>
      <nav class="nav">
        <a routerLink="/patient">Patient</a>
        <a routerLink="/staff" routerLinkActive="active">Staff</a>
        <a routerLink="/admin">Admin</a>
      </nav>
    </div>
  `,
  styles: [`
    .staff-layout { min-height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 1.5rem; background: #1b5e20; color: white; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0; opacity: 0.9; font-size: 0.9rem; }
    .content { flex: 1; padding: 1.5rem; }
    .placeholder { color: #666; }
    .store-integration { margin-top: 1rem; }
    .store-integration h2, .demo-controls h2 { font-size: 1rem; margin: 0 0 0.5rem; }
    .patient-list { list-style: none; padding: 0; margin: 0; }
    .patient-row { display: flex; gap: 0.75rem; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid #eee; }
    .patient-row.missed { background: #fff3e0; }
    .patient-row .id { font-family: monospace; }
    .patient-row .alert[data-alert="red"] { color: #c62828; font-weight: 600; }
    .patient-row .alert[data-alert="amber"] { color: #ef6c00; }
    .patient-row .alert[data-alert="green"] { color: #2e7d32; }
    .patient-row .badge { font-size: 0.75rem; background: #ff9800; color: #fff; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .empty { color: #888; font-style: italic; }
    .demo-controls { margin-top: 1.5rem; }
    .demo-hint { color: #666; font-size: 0.9rem; margin: 0 0 0.5rem; }
    .demo-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .demo-buttons button { padding: 0.4rem 0.75rem; cursor: pointer; }
    .nav { display: flex; gap: 1rem; padding: 1rem; background: #f5f5f5; }
    .nav a { color: #2e7d32; text-decoration: none; }
    .nav a.active { font-weight: 600; }
  `],
})
export class StaffComponent implements OnInit {
  private store = inject(PatientStoreService);

  patients$ = this.store.getPatients();

  ngOnInit(): void {}

  seedDemo(): void {
    this.store.seedDemoPatients();
  }

  advance15(): void {
    this.store.advanceDemoTime(15 * 60 * 1000);
  }

  resetTime(): void {
    this.store.clearDemoTime();
  }
}