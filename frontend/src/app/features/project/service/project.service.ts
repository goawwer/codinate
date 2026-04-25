import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Project } from '../types/model/project.model';
import { CreateProjectInput, UpdateProjectInput } from '../types/model/project-dashboard.model';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseURL = '/api/projects';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<Project[]> {
    return this.httpClient.get<Project[]>(`${this.baseURL}`);
  }

  create(body: CreateProjectInput, file?: File): Observable<number> {
    const formData = new FormData();
    if (file) formData.append('avatar', file);
    formData.append('payload', JSON.stringify(body));
    return this.httpClient
      .post<{ id: number }>(`${this.baseURL}/create`, formData)
      .pipe(map((res) => res.id));
  }

  update(id: number, body: UpdateProjectInput, file?: File): Observable<void> {
    const formData = new FormData();
    if (file) formData.append('avatar', file);
    formData.append('payload', JSON.stringify(body));
    return this.httpClient.patch<void>(`${this.baseURL}/${id}/update`, formData);
  }

  deleteMany(ids: number[]): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete`, { body: { ids } });
  }

  deletePicture(projectId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${projectId}/delete/picture`);
  }

  addMember(projectId: number, memberId: string): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/${projectId}/add/${memberId}`, {});
  }

  removeMember(projectId: number, memberId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${projectId}/delete/${memberId}`);
  }
}
