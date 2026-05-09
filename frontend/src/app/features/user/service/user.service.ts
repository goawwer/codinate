import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../types/model/user.model';
import { CreateUserInput, UpdateUserInput, UserFilters } from '../types/model/dashboard.model';
import { UpdateProfileInput, UserProfile, UserProfileStats } from '../types/model/profile.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly baseURL = '/api/users';
  private readonly currentURL = '/api/current';
  private readonly httpClient = inject(HttpClient);

  getAll(filters: UserFilters = {}): Observable<User[]> {
    let params = new HttpParams().set('sortBy', 'createdAt').set('sort', 'desc');
    if (filters.disabled !== undefined) {
      params = params.set('disabled', String(filters.disabled));
    }
    return this.httpClient.get<User[]>(`${this.baseURL}/all`, { params });
  }

  getById(id: string): Observable<User> {
    return this.httpClient.get<User>(`${this.baseURL}/${id}`);
  }

  getProfileStats(userId: string, from: string, to: string): Observable<UserProfileStats> {
    return this.httpClient.get<UserProfileStats>(`${this.baseURL}/profile/${userId}/stats`, {
      params: { from, to },
    });
  }

  create(body: CreateUserInput): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/add`, body);
  }

  update(id: string, body: UpdateUserInput): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseURL}/update/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete/${id}`);
  }

  deleteMany(ids: string[]): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete`, { body: { ids } });
  }

  currentUser(): Observable<User> {
    return this.httpClient.get<User>(`${this.currentURL}/user`);
  }

  getProfile(userId: string): Observable<UserProfile> {
    return this.httpClient.get<UserProfile>(`${this.baseURL}/profile/${userId}`);
  }

  updateProfile(
    userId: string,
    body: UpdateProfileInput,
    avatar?: File,
    background?: File,
  ): Observable<void> {
    const formData = new FormData();
    if (avatar) formData.append('avatar', avatar);
    if (background) formData.append('background', background);
    formData.append('payload', JSON.stringify(body));
    return this.httpClient.patch<void>(`${this.baseURL}/profile/${userId}`, formData);
  }
}
