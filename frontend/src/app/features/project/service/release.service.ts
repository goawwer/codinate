import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Release {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseInput {
  title: string;
  description: string;
  status: string;
  startAt: string;
  endAt: string;
}

export interface UpdateReleaseInput {
  title?: string;
  description?: string;
  status?: string;
  startAt?: string;
  updateAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReleaseService {
  private readonly baseURL = '/api/projects/releases';
  private readonly http = inject(HttpClient);

  getByProject(projectId: number): Observable<Release[]> {
    return this.http.get<Release[]>(`${this.baseURL}/${projectId}`);
  }

  add(projectId: number, input: CreateReleaseInput): Observable<void> {
    return this.http.post<void>(`${this.baseURL}/${projectId}/add`, input);
  }

  update(id: number, input: UpdateReleaseInput): Observable<void> {
    return this.http.patch<void>(`${this.baseURL}/${id}/update`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}/delete`);
  }
}
