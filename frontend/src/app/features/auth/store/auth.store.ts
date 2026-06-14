import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AuthApiService } from '../service/auth.service';
import { UserStore } from '../../user/store/user.store';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { WithErrorAlertOperator } from '../../../core/declarations/operators/with-error.operator';
import { LoginBody } from '../model/auth.model';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, exhaustMap, finalize, firstValueFrom, of, pipe, tap } from 'rxjs';
import { inject } from '@angular/core';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserApiService } from '../../user/service/user.service';

interface IAuthState {
  loading: boolean;
  authenticated: boolean;
}

const initialAuthState: IAuthState = {
  loading: false,
  authenticated: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialAuthState),
  withMethods(
    (
      store,
      authApiService = inject(AuthApiService),
      usersService = inject(UserApiService),
      userStore = inject(UserStore),
      router = inject(Router),
      translate = inject(TranslateService),
      withErrorAlertOperator = inject(WithErrorAlertOperator),
      authState = inject(AuthStateService),
    ) => ({
      login: rxMethod<LoginBody>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          exhaustMap((params) =>
            authApiService.signIn(params).pipe(
              tap(() => {
                patchState(store, { authenticated: true, loading: false });
                authState.initialized.set(true);
              }),
              tap(() => userStore.loadUserData()),
              tap(() => userStore.loadUsers({})),
              tap(() => router.navigate(['/'])),
              withErrorAlertOperator.call(translate.instant('auth.errors.signInFailed')),
            ),
          ),
        ),
      ),
      async restoreSession(): Promise<void> {
        patchState(store, { loading: true });

        try {
          const user = await firstValueFrom(
            usersService.currentUser().pipe(catchError(() => of(null))),
          );

          if (user) {
            patchState(store, { authenticated: true, loading: false });
            authState.initialized.set(true);
            userStore.setUser(user);
            userStore.loadUsers({});
          } else {
            patchState(store, { ...initialAuthState });
            authState.initialized.set(false);
            userStore.clearUser();
          }
        } catch (err: any) {
          if (err.status === 401) {
            patchState(store, { ...initialAuthState });
            userStore.clearUser();
            router.navigate(['/auth/login']);
          }
        }
      },

      logout(): void {
        authApiService
          .logout()
          .pipe(
            finalize(() => {
              patchState(store, { ...initialAuthState });
              authState.initialized.set(false);
              userStore.clearUser();
              router.navigate(['/auth/login']);
            }),
          )
          .subscribe();
      },
    }),
  ),
);
