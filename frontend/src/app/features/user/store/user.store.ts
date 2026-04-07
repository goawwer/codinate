import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { User } from '../types/model/user.model';
import { computed, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CurrentApiService } from '../../current/service/current.service';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, tap } from 'rxjs';
import { AT_LEAST_ADMIN } from '../types/enum/role.enum';

type UserState = {
  user: User | null;
  status: Nullable<StoreStatus>;
};

const initialState: UserState = {
  user: null,
  status: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => {
      const status = store.status();

      return status && [StoreStatus.Loading, StoreStatus.Saving].includes(status);
    }),
    isAtLeastAdmin: computed(() => {
      const role = store.user()?.role;
      return role != null && AT_LEAST_ADMIN.includes(role);
    }),
  })),
  withMethods(
    (
      store,
      currentApiService = inject(CurrentApiService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadUserData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          exhaustMap(() => currentApiService.user()),
          tap((response) => {
            patchState(store, {
              user: response,
              status: StoreStatus.Loaded,
            });
          }),
          catchError((error) => {
            console.error('Error loading current user: ', error);
            patchState(store, {
              ...initialState,
              status: StoreStatus.LoadError,
            });
            alertService.error(translate.instant('user.errors.currentUserLoadFailed'));

            return EMPTY;
          }),
        ),
      ),

      setUser(user: User): void {
        patchState(store, {
          user,
          status: StoreStatus.Loaded,
        });
      },

      clearUser(): void {
        patchState(store, initialState);
      },

      /*
      saveUser: rxMethod<Partial<User>>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          map((data) => ({
            ...data,
          })),
          exhaustMap((data) => {}),
        ),
      ),
      */
    }),
  ),
);
