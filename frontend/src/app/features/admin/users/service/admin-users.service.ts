import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../user/types/model/user.model';

export interface CreateUserInput {
  name: string;
  surname: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  role?: string;
  username?: string;
  profilePicture?: string;
  disabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly baseURL = '/api/user';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<User[]> {
    return this.httpClient.get<User[]>(`${this.baseURL}/all`);
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
