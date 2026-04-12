import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, tap } from 'rxjs';
import { EmployeeRole, EmployeeRolesService } from '../service/employee-roles.service';

type EmployeeRolesState = {
  roles: EmployeeRole[];
  loaded: boolean;
};

export const EmployeeRolesStore = signalStore(
  { providedIn: 'root' },
  withState<EmployeeRolesState>({ roles: [], loaded: false }),
  withComputed((store) => ({
    roleNames: computed(() => store.roles().map((r) => r.name)),
  })),
  withMethods((store, rolesService = new EmployeeRolesService()) => ({
    load: rxMethod<void>(
      pipe(
        exhaustMap(() => rolesService.getAll()),
        tap((roles) => patchState(store, { roles, loaded: true })),
        catchError(() => EMPTY),
      ),
    ),
  })),
);
