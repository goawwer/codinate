import { Routes } from '@angular/router';
import { UserTasks } from './components/user-tasks/user-tasks';

export const USERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'assigned' },
  { path: 'assigned', component: UserTasks },
  { path: 'created', component: UserTasks },
  { path: 'history', component: UserTasks },
];
