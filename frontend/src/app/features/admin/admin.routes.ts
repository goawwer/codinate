import { Route } from '@angular/router';
import { adminGuardFn } from '../../core/guards/admin.guard';
import { AdminUsers } from './components/users/all/admin-users';
import { AdminSettings } from './components/settings/admin-settings';

export const ADMIN_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [adminGuardFn()],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
      {
        path: 'users',
        component: AdminUsers,
      },
      {
        path: 'settings',
        component: AdminSettings,
      },
    ],
  },
];
