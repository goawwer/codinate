import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap, distinctUntilChanged } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../user/types/model/user.model';
import { Nullable } from '../../../../core/declarations/types/nullable.type';
import { StoreStatus } from '../../../../core/declarations/types/store-statuses.type';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import {
  AdminUsersService,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from '../service/admin-users.service';

type AdminUsersState = {
  users: User[];
  status: Nullable<StoreStatus>;
};

const initialState: AdminUsersState = {
  users: [],
  status: null,
};

export const AdminUsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => {
      const status = store.status();
      return status != null && [StoreStatus.Loading, StoreStatus.Saving].includes(status);
    }),
  })),
  withMethods(
    (
      store,
      usersService = inject(AdminUsersService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadUsers: rxMethod<UserFilters>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap((filters) => usersService.getAll(filters)),
          tap((users) => patchState(store, { users, status: StoreStatus.Loaded })),
          catchError(() => {
            patchState(store, { status: StoreStatus.LoadError });
            alertService.error(translate.instant('admin.users.errors.loadFailed'));
            return EMPTY;
          }),
        ),
      ),

      createUser: rxMethod<CreateUserInput>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((input) =>
            usersService.create(input).pipe(
              switchMap(() => usersService.getAll()),
              tap((users) => {
                patchState(store, { users, status: StoreStatus.Saved });
                alertService.success(translate.instant('admin.users.success.created'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('admin.users.errors.createFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateUser: rxMethod<{ id: string; input: UpdateUserInput }>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap(({ id, input }) =>
            usersService.update(id, input).pipe(
              switchMap(() => usersService.getAll()),
              tap((users) => {
                patchState(store, { users, status: StoreStatus.Saved });
                alertService.success(translate.instant('admin.users.success.updated'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('admin.users.errors.updateFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteUser: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((id) =>
            usersService.delete(id).pipe(
              switchMap(() => usersService.getAll()),
              tap((users) => {
                patchState(store, { users, status: StoreStatus.Saved });
                alertService.success(translate.instant('admin.users.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('admin.users.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteUsers: rxMethod<string[]>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((ids) =>
            usersService.deleteMany(ids).pipe(
              switchMap(() => usersService.getAll()),
              tap((users) => {
                patchState(store, { users, status: StoreStatus.Saved });
                alertService.success(translate.instant('admin.users.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('admin.users.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
