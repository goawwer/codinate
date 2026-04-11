import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStore } from '../../features/user/store/user.store';

export function adminGuardFn(): CanActivateFn {
  return () => {
    const router = inject(Router);
    const userStore = inject(UserStore);

    return userStore.isAtLeastAdmin() ? true : router.parseUrl('/');
  };
}
