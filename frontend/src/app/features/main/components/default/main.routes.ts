import { Route } from '@angular/router';
import { MainPage } from './main-page';
import { MainActivityComponent } from '../activity/activity';

export const MAIN_ROUTES: Route[] = [
  {
    path: '',
    component: MainPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'activity' },
      { path: 'activity', component: MainActivityComponent },
    ],
  },
];
