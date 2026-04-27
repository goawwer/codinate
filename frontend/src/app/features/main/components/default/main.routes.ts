import { Route } from '@angular/router';
import { MainPage } from './main-page';
import { MainFeedComponent } from '../feed/feed';
import { AllProjectsComponent } from '../projects/projects';
import { AllTeamsComponent } from '../teams/teams';

export const MAIN_ROUTES: Route[] = [
  {
    path: '',
    component: MainPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'feed' },
      { path: 'feed', component: MainFeedComponent },
      { path: 'projects', component: AllProjectsComponent },
      { path: 'teams', component: AllTeamsComponent },
    ],
  },
];
