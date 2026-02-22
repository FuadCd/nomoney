import { Routes } from '@angular/router';
import { staffGuard } from './core/auth/staff.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'FairQ',
  },
  {
    path: 'patient',
    loadComponent: () =>
      import('./features/patient/patient.component').then((m) => m.PatientComponent),
    title: 'Patient Intake | FairQ',
    children: [
      { path: '', redirectTo: 'intake/1', pathMatch: 'full' },
      // Intake steps: 1=context & risk (hospital, discomfort, leaving), 2=accessibility toggles, 3=confirm
      {
        path: 'intake',
        redirectTo: 'intake/1',
        pathMatch: 'full',
      },
      {
        path: 'intake/:step',
        loadComponent: () =>
          import('./features/patient/intake/intake.component').then((m) => m.IntakeComponent),
      },
      {
        path: 'checkin',
        loadComponent: () =>
          import('./features/patient/checkin/checkin.component').then((m) => m.CheckinComponent),
      },
      {
        path: 'waiting',
        loadComponent: () =>
          import('./features/patient/waiting/waiting.component').then((m) => m.WaitingComponent),
      },
    ],
  },
  {
    path: 'staff',
    loadComponent: () => import('./features/staff/staff.component').then((m) => m.StaffComponent),
    title: 'Staff Dashboard | FairQ',
    canActivate: [staffGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Equity Simulator | FairQ',
    canActivate: [staffGuard],
  },
  { path: '**', redirectTo: '' },
];
