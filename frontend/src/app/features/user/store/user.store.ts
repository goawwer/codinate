import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { User } from '../types/model/user.model';
import { computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { AT_LEAST_ADMIN, ANY_USER, EnumPermissionRole } from '../types/enum/role.enum';
import { UserApiService } from '../service/user.service';
import { CreateUserInput, UpdateUserInput, UserFilters } from '../types/model/dashboard.model';

type UserState = {
  user: User | null;
  users: User[];
  viewedUser: User | null;
  status: Nullable<StoreStatus>;
};

const initialState: UserState = {
  user: null,
  users: [],
  viewedUser: null,
  status: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => {
      const status = store.status();
      return status != null && [StoreStatus.Loading, StoreStatus.Saving].includes(status);
    }),
    isAtLeastAdmin: computed(() => {
      const permission = store.user()?.permission;
      return permission != null && AT_LEAST_ADMIN.includes(permission);
    }),
    assignablePermissions: computed((): EnumPermissionRole[] => {
      const permission = store.user()?.permission;
      if (permission === EnumPermissionRole.OwnerRole) return ANY_USER;
      if (permission === EnumPermissionRole.AdminRole)
        return [EnumPermissionRole.AdminRole, EnumPermissionRole.UserRole];
      return [];
    }),
  })),
  withMethods(
    (
      store,
      usersService = inject(UserApiService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadUserData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          exhaustMap(() =>
            usersService.currentUser().pipe(
              tap((response) => {
                patchState(store, { user: response, status: StoreStatus.Loaded });
              }),
              catchError((error) => {
                console.error('Error loading current user: ', error);
                patchState(store, { ...initialState, status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.user.errors.currentUserLoadFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      setUser(user: User): void {
        patchState(store, { user, status: StoreStatus.Loaded });
      },

      clearUser(): void {
        patchState(store, initialState);
      },

      loadUserById: rxMethod<string>(
        pipe(
          exhaustMap((id) =>
            usersService.getById(id).pipe(
              tap((viewedUser) => patchState(store, { viewedUser })),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),

      loadUsers: rxMethod<UserFilters>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap((filters) =>
            usersService.getAll(filters).pipe(
              tap((users) => patchState(store, { users, status: StoreStatus.Loaded })),
              catchError(() => {
                patchState(store, { status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.user.errors.loadFailed'));
                return EMPTY;
              }),
            ),
          ),
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
                alertService.success(translate.instant('cmd.user.success.created'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.user.errors.createFailed'));
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
                alertService.success(translate.instant('cmd.user.success.updated'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.user.errors.updateFailed'));
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
                alertService.success(translate.instant('cmd.user.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.user.errors.deleteFailed'));
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
                alertService.success(translate.instant('cmd.user.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.user.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
