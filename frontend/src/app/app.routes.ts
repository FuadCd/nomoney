import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'patient', pathMatch: 'full' },
  {
    path: 'patient',
    loadComponent: () =>
      import('./features/patient/patient.component').then((m) => m.PatientComponent),
    title: 'Patient Intake | AccessER',
    children: [
      { path: '', redirectTo: 'intake', pathMatch: 'full' },
      {
        path: 'intake',
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
    title: 'Staff Dashboard | AccessER',
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Equity Simulator | AccessER',
  },
  { path: '**', redirectTo: 'patient' },
];
