import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core/primitives/di';
import { User } from '../types/model/user.model';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private baseURL = '/api/user';

  private httpClient = inject(HttpClient);

  /*
  update(body: User): Observable<User> {
    return this.httpClient.patch<User>(`${this.baseURL}/update/${id}`, {
      withCredentials: true,
    });
  }
  */
}
