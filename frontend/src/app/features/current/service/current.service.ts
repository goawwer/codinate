import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { Observable } from 'rxjs';
import { User } from '../../user/types/model/user.model';

@Injectable({ providedIn: 'root' })
export class CurrentApiService {
  private baseURL = '/api/current';

  private httpClient = inject(HttpClient);

  user(): Observable<User> {
    return this.httpClient.get<User>(`${this.baseURL}/user`);
  }
}
