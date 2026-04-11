import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authState = inject(AuthStateService);

  if (req.url.startsWith('assets/') || req.url.startsWith('/assets/')) {
    return next(req);
  }

  const apiReq = req.clone({ withCredentials: true });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authState.initialized()) {
        authState.initialized.set(false);
        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    }),
  );
};
