import { Route } from '@angular/router';
import { MainPage } from './main-page';
import { Check } from '../check/check';

export const MAIN_ROUTES: Route[] = [
  {
    path: '',
    component: MainPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'activity' },
      { path: 'activity', component: Check },
    ],
  },
];
