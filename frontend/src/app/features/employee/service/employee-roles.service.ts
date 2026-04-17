import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EmployeeRole {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeRolesService {
  private readonly baseURL = '/api/employees/roles';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<EmployeeRole[]> {
    return this.httpClient.get<EmployeeRole[]>(this.baseURL);
  }

  add(name: string): Observable<void> {
    return this.httpClient.post<void>(`${this.baseURL}/add`, { name });
  }

  update(id: number, name: string): Observable<void> {
    return this.httpClient.patch<void>(`${this.baseURL}/update/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseURL}/delete/${id}`);
  }
}
