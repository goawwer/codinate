import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../types/model/project.model';
import { CreateProjectInput, UpdateProjectInput } from '../types/model/project-dashboard.model';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseURL = '/api/projects';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<Project[]> {
    return this.httpClient.get<Project[]>(`${this.baseURL}`);
  }

  create(body: CreateProjectInput): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/add`, body);
  }

  update(id: number, body: UpdateProjectInput): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseURL}/update/${id}`, body);
  }

  deleteMany(ids: number[]): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete`, { body: { ids } });
  }

  removeMember(projectId: number, userId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${projectId}/members/${userId}`);
  }
}
