import { Route } from '@angular/router';
import { adminGuardFn } from '../../core/guards/admin.guard';
import { AdminUsers } from './components/users/all/admin-users';
import { AdminProjects } from './components/projects/all/admin-projects';
import { AdminTeams } from './components/teams/all/admin-teams';
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
        path: 'teams',
        component: AdminTeams,
      },
      {
        path: 'projects',
        component: AdminProjects,
      },
      {
        path: 'settings',
        component: AdminSettings,
      },
    ],
  },
];
