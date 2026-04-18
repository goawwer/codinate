import { Route } from '@angular/router';
import { ProjectDetailComponent } from './components/project-detail/project-detail';

export const PROJECTS_ROUTES: Route[] = [
  {
    path: '',
    children: [
      {
        path: ':id',
        component: ProjectDetailComponent,
      },
    ],
  },
];
