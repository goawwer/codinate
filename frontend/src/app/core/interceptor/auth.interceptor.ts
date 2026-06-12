import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { TokenRefreshService } from '../services/token-refresh.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const tokenRefresh = inject(TokenRefreshService);

  if (req.url.startsWith('assets/') || req.url.startsWith('/assets/')) {
    return next(req);
  }

  const apiReq = req.clone({ withCredentials: true });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authState.initialized()) {
        // One shared refresh call for all concurrent 401s.
        // The browser already has a valid refresh cookie from whichever concurrent
        // request the backend auto-refreshed first, so this call will succeed.
        return tokenRefresh.refresh().pipe(
          switchMap(() => next(apiReq)),
          catchError(() => {
            authState.initialized.set(false);
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
