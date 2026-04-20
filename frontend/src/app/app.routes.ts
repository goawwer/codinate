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
        redirectTo: 'main',
      },
      {
        path: 'main',
        loadChildren: () =>
          import('./features/main/components/default/main.routes').then((m) => m.MAIN_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/project/project.routes').then((m) => m.PROJECTS_ROUTES),
      },
      {
        path: 'teams',
        loadChildren: () => import('./features/team/team.routes').then((m) => m.TEAMS_ROUTES),
      },
      {
        path: 'mine',
        loadChildren: () => import('./features/user/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/task/detailed/detailed').then((m) => m.Detailed),
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
    redirectTo: 'main',
  },
];
