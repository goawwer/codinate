import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Team } from '../types/model/team.model';
import { computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { TeamApiService } from '../service/team.service';
import { CreateTeamInput, UpdateTeamInput } from '../types/model/team-dashboard.model';

type TeamState = {
  teams: Team[];
  status: Nullable<StoreStatus>;
};

const initialState: TeamState = {
  teams: [],
  status: null,
};

export const TeamStore = signalStore(
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
      teamsService = inject(TeamApiService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadTeams: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap(() =>
            teamsService.getAll().pipe(
              tap((teams) => patchState(store, { teams, status: StoreStatus.Loaded })),
              catchError(() => {
                patchState(store, { status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.teams.errors.loadFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createTeam: rxMethod<CreateTeamInput>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((input) =>
            teamsService.create(input).pipe(
              switchMap(() => teamsService.getAll()),
              tap((teams) => {
                patchState(store, { teams, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.teams.success.created'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.teams.errors.createFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateTeam: rxMethod<{ id: number; input: UpdateTeamInput }>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap(({ id, input }) =>
            teamsService.update(id, input).pipe(
              switchMap(() => teamsService.getAll()),
              tap((teams) => {
                patchState(store, { teams, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.teams.success.updated'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.teams.errors.updateFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteTeams: rxMethod<number[]>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((ids) =>
            teamsService.deleteMany(ids).pipe(
              switchMap(() => teamsService.getAll()),
              tap((teams) => {
                patchState(store, { teams, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.teams.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.teams.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
