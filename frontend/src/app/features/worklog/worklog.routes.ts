import { Routes } from '@angular/router';

export const WORKLOG_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'overview',
  },
  {
    path: 'overview',
    loadComponent: () => import('./components/main/worklog').then((m) => m.WorklogComponent),
  },
  {
    path: 'dailyPlan',
    loadComponent: () =>
      import('./components/daily-plan/daily-plan').then((m) => m.DailyPlanComponent),
  },
];
