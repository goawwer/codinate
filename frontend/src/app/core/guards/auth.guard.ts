import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/store/auth.store';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export type AuthGuardType = 'protected' | 'unprotected';

export function authGuardFn(type: AuthGuardType = 'protected'): CanActivateFn {
  return () => {
    const router = inject(Router);
    const store = inject(AuthStore);

    const check = () => {
      switch (type) {
        case 'protected':
          return store.authenticated() ? true : router.parseUrl('/auth/login');

        case 'unprotected':
          return store.authenticated() ? router.parseUrl('/') : true;
      }
    };

    if (!store.loading()) return check();

    return toObservable(store.loading).pipe(
      filter((loading) => !loading),
      take(1),
      map(() => check()),
    );
  };
}
