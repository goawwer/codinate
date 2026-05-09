import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWorklogInput, LeaderboardEntry, WorklogRow } from '../types/worklog.model';

@Injectable({ providedIn: 'root' })
export class WorklogService {
  private readonly baseUrl = '/api/worklogs';
  private readonly http = inject(HttpClient);

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`);
  }

  getAll(userId: string, params?: HttpParams, projectId?: number): Observable<WorklogRow[]> {
    let p = params ?? new HttpParams();
    if (projectId) p = p.set('projectId', projectId);
    return this.http.get<WorklogRow[]>(`${this.baseUrl}/${userId}/all`, { params: p });
  }

  add(input: CreateWorklogInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/add`, input);
  }

  update(logId: string, input: CreateWorklogInput): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${logId}/update`, input);
  }

  delete(logId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${logId}/delete`);
  }
}
