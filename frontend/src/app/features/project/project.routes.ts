import { Route } from '@angular/router';
import { AllProjectsComponent } from './components/all-projects/all-projects';
import { ProjectDetailComponent } from './components/project-detail/project-detail';

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
      {
        path: ':id',
        component: ProjectDetailComponent,
      },
    ],
  },
];
