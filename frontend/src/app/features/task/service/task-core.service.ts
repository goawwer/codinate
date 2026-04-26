import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTaskInput, Task, TaskDetailed, UpdateTaskInput } from '../types/task.model';

@Injectable({ providedIn: 'root' })
export class TaskCoreService {
  private readonly baseURL = '/api/tasks';
  private readonly http = inject(HttpClient);

  getAll(params?: HttpParams): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseURL, { params });
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
}
