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

@Injectable({ providedIn: 'root' })
export class ReleaseService {
  private readonly baseURL = '/api/projects/releases';
  private readonly http = inject(HttpClient);

  getByProject(projectId: number): Observable<Release[]> {
    return this.http.get<Release[]>(`${this.baseURL}/${projectId}`);
  }
}
