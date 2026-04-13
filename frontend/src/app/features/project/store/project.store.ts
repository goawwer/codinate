import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Project } from '../types/model/project.model';
import { computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { ProjectApiService } from '../service/project.service';
import { CreateProjectInput, UpdateProjectInput } from '../types/model/project-dashboard.model';

type ProjectState = {
  projects: Project[];
  status: Nullable<StoreStatus>;
};

const initialState: ProjectState = {
  projects: [],
  status: null,
};

export const ProjectStore = signalStore(
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
      projectsService = inject(ProjectApiService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadProjects: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap(() =>
            projectsService.getAll().pipe(
              tap((projects) => patchState(store, { projects, status: StoreStatus.Loaded })),
              catchError(() => {
                patchState(store, { status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.projects.errors.loadFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createProject: rxMethod<CreateProjectInput>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((input) =>
            projectsService.create(input).pipe(
              switchMap(() => projectsService.getAll()),
              tap((projects) => {
                patchState(store, { projects, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.projects.success.created'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.projects.errors.createFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateProject: rxMethod<{ id: number; input: UpdateProjectInput }>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap(({ id, input }) =>
            projectsService.update(id, input).pipe(
              switchMap(() => projectsService.getAll()),
              tap((projects) => {
                patchState(store, { projects, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.projects.success.updated'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.projects.errors.updateFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteProjects: rxMethod<number[]>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((ids) =>
            projectsService.deleteMany(ids).pipe(
              switchMap(() => projectsService.getAll()),
              tap((projects) => {
                patchState(store, { projects, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.projects.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.projects.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
