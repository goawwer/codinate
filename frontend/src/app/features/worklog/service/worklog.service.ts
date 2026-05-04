import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWorklogInput, WorklogRow } from '../types/worklog.model';

@Injectable({ providedIn: 'root' })
export class WorklogService {
  private readonly baseUrl = '/api/worklogs';
  private readonly http = inject(HttpClient);

  getAll(userId: string, params?: HttpParams): Observable<WorklogRow[]> {
    return this.http.get<WorklogRow[]>(`${this.baseUrl}/${userId}/all`, { params });
  }

  add(userId: string, input: CreateWorklogInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/${userId}/add`, input);
  }
}
