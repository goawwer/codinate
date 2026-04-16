import { Route } from '@angular/router';
import { AllProjectsComponent } from './components/all-projects/all-projects';

export const PROJECTS_ROUTES: Route[] = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'projects',
      },
      {
        path: 'projects',
        component: AllProjectsComponent,
      },
    ],
  },
];
