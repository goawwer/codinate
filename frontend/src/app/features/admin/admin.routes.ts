import { Route } from '@angular/router';
import { adminGuardFn } from '../../core/guards/admin.guard';
import { AdminUsers } from './users/components/all/admin-users';

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
    ],
  },
];
