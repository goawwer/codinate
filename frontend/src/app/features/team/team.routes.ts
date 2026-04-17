import { Route } from '@angular/router';
import { TeamDetailComponent } from './components/team-detail/team-detail';

export const TEAMS_ROUTES: Route[] = [
  {
    path: '',
    children: [
      {
        path: ':id',
        component: TeamDetailComponent,
      },
    ],
  },
];
