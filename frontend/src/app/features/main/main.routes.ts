import { Route } from '@angular/router';
import { MainPage } from './main-page';
import { Check } from '../check/check';
import { AllTeamsComponent } from '../team/components/all-teams/all-teams';
import { AllProjectsComponent } from '../project/components/all-projects/all-projects';

export const MAIN_ROUTES: Route[] = [
  {
    path: '',
    component: MainPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'activity' },
      { path: 'activity', component: Check },
      { path: 'teams', component: AllTeamsComponent },
      { path: 'projects', component: AllProjectsComponent },
    ],
  },
];
