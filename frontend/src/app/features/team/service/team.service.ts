import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Team } from '../types/model/team.model';
import { CreateTeamInput, UpdateTeamInput } from '../types/model/team-dashboard.model';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly baseURL = '/api/teams';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<Team[]> {
    return this.httpClient.get<Team[]>(`${this.baseURL}`);
  }

  create(body: CreateTeamInput): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/add`, body);
  }

  update(id: number, body: UpdateTeamInput): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseURL}/update/${id}`, body);
  }

  deleteMany(ids: number[]): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete`, { body: { ids } });
  }

  removeMember(teamId: number, userId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${teamId}/members/${userId}`);
  }
}
