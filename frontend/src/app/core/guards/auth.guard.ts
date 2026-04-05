import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/store/auth.store';

export type AuthGuardType = 'protected' | 'unprotected';

export function authGuardFn(type: AuthGuardType = 'protected'): CanActivateFn {
  return () => {
    const router = inject(Router);
    const authenticated = inject(AuthStore).authenticated();

    switch (type) {
      case 'protected':
        return authenticated ? true : router.parseUrl('/auth/login');

      case 'unprotected':
        return authenticated ? router.parseUrl('/') : true;
    }
  };
}
