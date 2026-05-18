import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification, UnreadCount } from '../types/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly baseURL = '/api/notifications';
  private readonly http = inject(HttpClient);

  getAll(since?: string): Observable<Notification[]> {
    let params = new HttpParams();
    if (since) {
      params = params.set('since', since);
    }
    return this.http.get<Notification[]>(this.baseURL, { params });
  }

  getUnreadCount(): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(`${this.baseURL}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/read-all`, {});
  }
}
