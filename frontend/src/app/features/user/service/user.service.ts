import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../types/model/user.model';
import { CreateUserInput, UpdateUserInput, UserFilters } from '../types/model/dashboard.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly baseURL = '/api/users';
  private readonly httpClient = inject(HttpClient);

  getAll(filters: UserFilters = {}): Observable<User[]> {
    let params = new HttpParams().set('sortBy', 'createdAt').set('sort', 'desc');
    if (filters.disabled !== undefined) {
      params = params.set('disabled', String(filters.disabled));
    }
    return this.httpClient.get<User[]>(`${this.baseURL}/all`, { params });
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
}
