import { Route } from '@angular/router';
import { MainPage } from './main-page';
import { MainActivityComponent } from '../activity/activity';
import { AllProjectsComponent } from '../projects/projects';

export const MAIN_ROUTES: Route[] = [
  {
    path: '',
    component: MainPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'activity' },
      { path: 'activity', component: MainActivityComponent },
      { path: 'projects', component: AllProjectsComponent },
    ],
  },
];
