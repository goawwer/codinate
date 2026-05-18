import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Notification } from '../types/notification.model';
import { NotificationApiService } from '../service/notification.service';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { getNotifBody, getNotifTitle } from '../utils/notification-text';

type NotificationState = {
  notifications: Notification[];
  lastFetchedAt: string | null;
  loading: boolean;
};

const initialState: NotificationState = {
  notifications: [],
  lastFetchedAt: null,
  loading: false,
};

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    unreadCount: computed(() => store.notifications().filter((n) => !n.readAt).length),
    hasUnread: computed(() => store.notifications().some((n) => !n.readAt)),
  })),
  withMethods(
    (
      store,
      api = inject(NotificationApiService),
      alertService = inject(AlertService),
      translate = inject(TranslateService),
    ) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          exhaustMap(() =>
            api.getAll().pipe(
              tap((notifications) => {
                patchState(store, {
                  notifications,
                  lastFetchedAt: new Date().toISOString(),
                  loading: false,
                });
              }),
              catchError(() => {
                patchState(store, { loading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      poll: rxMethod<void>(
        pipe(
          switchMap(() => {
            const since = store.lastFetchedAt();
            return api.getAll(since ?? undefined).pipe(
              tap((incoming) => {
                if (incoming.length === 0) return;

                const existingIds = new Set(store.notifications().map((n) => n.id));
                const newOnes = incoming.filter((n) => !existingIds.has(n.id));

                if (newOnes.length > 0) {
                  patchState(store, {
                    notifications: [...newOnes, ...store.notifications()],
                  });

                  newOnes.forEach((n) => {
                    const body = getNotifBody(n, translate);
                    alertService.notification(body, getNotifTitle(n, translate));
                  });
                }

                patchState(store, { lastFetchedAt: new Date().toISOString() });
              }),
              catchError(() => EMPTY),
            );
          }),
        ),
      ),

      markAsRead: rxMethod<string>(
        pipe(
          exhaustMap((id) =>
            api.markAsRead(id).pipe(
              tap(() => {
                patchState(store, {
                  notifications: store.notifications().map((n) =>
                    n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
                  ),
                });
              }),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),

      markAllAsRead: rxMethod<void>(
        pipe(
          exhaustMap(() =>
            api.markAllAsRead().pipe(
              tap(() => {
                patchState(store, {
                  notifications: store.notifications().map((n) => ({
                    ...n,
                    readAt: n.readAt ?? new Date().toISOString(),
                  })),
                });
              }),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),
    }),
  ),
);
