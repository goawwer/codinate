import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Team, TeamLink } from '../types/model/team.model';
import { CreateTeamInput, UpdateTeamInput } from '../types/model/team-dashboard.model';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly baseURL = '/api/teams';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<Team[]> {
    return this.httpClient.get<Team[]>(`${this.baseURL}`);
  }

  getById(id: number): Observable<Team> {
    return this.httpClient.get<Team>(`${this.baseURL}/${id}`);
  }

  create(body: CreateTeamInput, file?: File): Observable<void> {
    const formData = new FormData();
    if (file) formData.append('avatar', file);
    formData.append('payload', JSON.stringify(body));
    return this.httpClient.post<void>(`${this.baseURL}/create`, formData);
  }

  update(id: number, body: UpdateTeamInput, file?: File): Observable<void> {
    const formData = new FormData();
    if (file) formData.append('avatar', file);
    formData.append('payload', JSON.stringify(body));
    return this.httpClient.patch<void>(`${this.baseURL}/${id}/update`, formData);
  }

  deleteMany(ids: number[]): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete`, { body: { ids } });
  }

  deletePicture(teamId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${teamId}/delete/picture`);
  }

  addMember(teamId: number, userId: string): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/${teamId}/add/${userId}`, null);
  }

  removeMember(teamId: number, userId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/${teamId}/delete/${userId}`);
  }

  updateLinks(id: number, links: TeamLink[]): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseURL}/${id}/links`, { links });
  }
}
