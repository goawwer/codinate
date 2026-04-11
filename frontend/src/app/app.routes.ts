import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/components/layout/auth-layout';
import { AuthLogin } from './features/auth/components/login/auth-login';
import { authGuardFn } from './core/guards/auth.guard';
import { MainLayoutComponent } from './common/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuardFn('protected')],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'check',
      },
      {
        path: 'check',
        loadChildren: () =>
          import('./features/check/check.routes').then((m) => m.CHECK_PAGE_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },

  // auth
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [authGuardFn('unprotected')],
    children: [{ path: 'login', component: AuthLogin }],
  },

  {
    path: '**',
    redirectTo: 'check',
  },
];
