import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTaskInput,
  DeadlinePressure,
  StatusDistributionItem,
  StatusTasksPage,
  Task,
  TaskDetailed,
  TaskSuggestion,
  UpdateTaskInput,
  VelocityData,
} from '../types/task.model';

@Injectable({ providedIn: 'root' })
export class TaskCoreService {
  private readonly baseURL = '/api/tasks';
  private readonly http = inject(HttpClient);

  getAll(params?: HttpParams): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseURL, { params });
  }

  getByIdentifier(identifier: number): Observable<Task[]> {
    const params = new HttpParams().set('identifier', identifier);
    return this.http.get<Task[]>(this.baseURL, { params });
  }

  searchSuggestions(query: string, limit = 8): Observable<TaskSuggestion[]> {
    return this.http.get<TaskSuggestion[]>(`${this.baseURL}/suggestions`, {
      params: {
        searchValue: query,
        limit,
      },
    });
  }

  getById(id: string): Observable<TaskDetailed> {
    return this.http.get<TaskDetailed>(`${this.baseURL}/${id}`);
  }

  add(body: CreateTaskInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseURL}/add`, body);
  }

  update(id: string, body: UpdateTaskInput): Observable<void> {
    return this.http.patch<void>(`${this.baseURL}/${id}/update`, body);
  }

  close(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${id}/close`, {});
  }

  reopen(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${id}/reopen`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}/delete`);
  }

  addParticipant(taskId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${taskId}/participants/${userId}/add`, {});
  }

  getDeadlinePressure(): Observable<DeadlinePressure> {
    return this.http.get<DeadlinePressure>(`${this.baseURL}/metrics/deadline`);
  }

  getStatusDistribution(): Observable<StatusDistributionItem[]> {
    return this.http.get<StatusDistributionItem[]>(`${this.baseURL}/metrics/status-distribution`);
  }

  getStatusTasks(statusId: number, page: number): Observable<StatusTasksPage> {
    return this.http.get<StatusTasksPage>(`${this.baseURL}/metrics/status-tasks`, {
      params: new HttpParams().set('statusId', statusId).set('pageNumber', page),
    });
  }

  getVelocity(): Observable<VelocityData> {
    return this.http.get<VelocityData>(`${this.baseURL}/metrics/velocity`);
  }
}
