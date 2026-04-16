import { Route } from '@angular/router';
import { AllTeamsComponent } from './components/all-teams/all-teams';

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
    ],
  },
];
