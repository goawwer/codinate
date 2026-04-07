import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../features/auth/store/auth.store';
import { UserStore } from '../../features/user/store/user.store';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const userStore = inject(UserStore);

  const isAsset = req.url.startsWith('assets/') || req.url.startsWith('/assets/');

  if (isAsset) {
    return next(req);
  }

  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authStore.logout();
        userStore.clearUser();
        router.navigate(['/auth/login']);
      }

      return throwError(() => err);
    }),
  );
};
