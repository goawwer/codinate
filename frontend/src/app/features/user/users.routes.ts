import { Routes } from '@angular/router';
import { UserTasks } from './components/user-tasks/user-tasks';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UserTasks,
  },
];
