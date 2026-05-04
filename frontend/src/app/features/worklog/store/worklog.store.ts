import { computed, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Nullable } from '../../../core/declarations/types/nullable.type';
import { StoreStatus } from '../../../core/declarations/types/store-statuses.type';
import { WorklogService } from '../service/worklog.service';
import { WorklogRow } from '../types/worklog.model';

type WorklogState = {
  logs: WorklogRow[];
  status: Nullable<StoreStatus>;
};

export const WorklogStore = signalStore(
  { providedIn: 'root' },
  withState<WorklogState>({ logs: [], status: null }),
  withComputed((store) => ({
    totalMinutes: computed(() => store.logs().reduce((sum, l) => sum + l.totalMinutes, 0)),
    isLoading: computed(() => store.status() === StoreStatus.Loading),
  })),
  withMethods((store, service = inject(WorklogService)) => ({
    loadLogs: rxMethod<{ userId: string; params: HttpParams }>(
      pipe(
        tap(() => patchState(store, { status: StoreStatus.Loading })),
        switchMap(({ userId, params }) =>
          service.getAll(userId, params).pipe(
            tap((logs) => patchState(store, { logs, status: StoreStatus.Loaded })),
            catchError(() => {
              patchState(store, { status: StoreStatus.LoadError });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
