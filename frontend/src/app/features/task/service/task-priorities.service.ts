import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TaskPriority {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TaskPrioritiesService {
  private readonly baseURL = '/api/tasks/priorities';
  private readonly http = inject(HttpClient);

  getAll(): Observable<TaskPriority[]> {
    return this.http.get<TaskPriority[]>(this.baseURL);
  }

  add(name: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/add`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/delete/${id}`);
  }
}
