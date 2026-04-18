import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TaskCategory {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TaskCategoriesService {
  private readonly baseURL = '/api/tasks';
  private readonly http = inject(HttpClient);

  getAll(projectId: number): Observable<TaskCategory[]> {
    return this.http.get<TaskCategory[]>(`${this.baseURL}/${projectId}/categories`);
  }

  add(projectId: number, name: string): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${projectId}/categories/add`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/categories/${id}/delete`);
  }
}
