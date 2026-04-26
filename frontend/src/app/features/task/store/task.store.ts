import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { TaskCoreService } from '../service/task-core.service';
import { CreateTaskInput, Task, TaskDetailed, UpdateTaskInput } from '../types/task.model';

type TaskState = {
  tasks: Task[];
  selectedTask: TaskDetailed | null;
  status: Nullable<StoreStatus>;
};

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  status: null,
};

export const TaskStore = signalStore(
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
      taskService = inject(TaskCoreService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      loadTasks: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap(() =>
            taskService.getAll().pipe(
              tap((tasks) => patchState(store, { tasks, status: StoreStatus.Loaded })),
              catchError(() => {
                patchState(store, { status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.tasks.errors.loadFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadTaskById: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Loading })),
          switchMap((id) =>
            taskService.getById(id).pipe(
              tap((selectedTask) =>
                patchState(store, { selectedTask, status: StoreStatus.Loaded }),
              ),
              catchError(() => {
                patchState(store, { status: StoreStatus.LoadError });
                alertService.error(translate.instant('cmd.tasks.errors.loadFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      addTask: rxMethod<{ input: CreateTaskInput; onSuccess?: (id: string) => void }>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap(({ input, onSuccess }) =>
            taskService.add(input).pipe(
              switchMap(({ id }) => taskService.getAll().pipe(tap((tasks) => ({ tasks, id })))),
              tap((tasks) => {
                patchState(store, { tasks, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.tasks.success.created'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.tasks.errors.createFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateTask: rxMethod<{ id: string; input: UpdateTaskInput }>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap(({ id, input }) =>
            taskService.update(id, input).pipe(
              switchMap(() => taskService.getAll()),
              tap((tasks) => {
                patchState(store, { tasks, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.tasks.success.updated'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.tasks.errors.updateFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      closeTask: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((id) =>
            taskService.close(id).pipe(
              switchMap(() => taskService.getAll()),
              tap((tasks) => {
                patchState(store, { tasks, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.tasks.success.closed'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.tasks.errors.closeFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteTask: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { status: StoreStatus.Saving })),
          exhaustMap((id) =>
            taskService.delete(id).pipe(
              switchMap(() => taskService.getAll()),
              tap((tasks) => {
                patchState(store, { tasks, status: StoreStatus.Saved });
                alertService.success(translate.instant('cmd.tasks.success.deleted'));
              }),
              catchError(() => {
                patchState(store, { status: StoreStatus.SaveError });
                alertService.error(translate.instant('cmd.tasks.errors.deleteFailed'));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
