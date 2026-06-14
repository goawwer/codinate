import { Injectable } from '@angular/core';
import { LoginBody } from '../model/auth.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core/primitives/di';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private loginURL = '/auth/login';

  private http = inject(HttpClient);

  signIn(body: LoginBody): Observable<void> {
    return this.http.post<void>(this.loginURL, body);
  }

  public logout(): Observable<void> {
    return this.http.get<void>('/auth/logout');
  }
}
