import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EmployeeRole {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeRolesService {
  private readonly baseURL = '/api/employee/roles';
  private readonly httpClient = inject(HttpClient);

  getAll(): Observable<EmployeeRole[]> {
    return this.httpClient.get<EmployeeRole[]>(this.baseURL);
  }
}
