import { Route } from '@angular/router';
import { AllTeamsComponent } from './components/all-teams/all-teams';
import { TeamDetailComponent } from './components/team-detail/team-detail';

export const TEAMS_ROUTES: Route[] = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'teams',
      },
      {
        path: 'teams',
        component: AllTeamsComponent,
      },
      {
        path: ':id',
        component: TeamDetailComponent,
      },
    ],
  },
];
