import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TaskStatus {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TaskStatusesService {
  private readonly baseURL = '/api/tasks/statuses';
  private readonly http = inject(HttpClient);

  getAll(): Observable<TaskStatus[]> {
    return this.http.get<TaskStatus[]>(this.baseURL);
  }

  add(name: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/add`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/delete/${id}`);
  }
}
