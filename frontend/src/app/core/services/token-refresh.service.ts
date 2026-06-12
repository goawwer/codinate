import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, share } from 'rxjs';
import { API_CONFIG } from '../declarations/tokens/api-config.token';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private pending$: Observable<unknown> | null = null;

  refresh(): Observable<unknown> {
    if (!this.pending$) {
      this.pending$ = this.http
        .get(`${this.apiConfig.rootUrl}/auth/refresh`, { withCredentials: true })
        .pipe(share());

      // Reset once the shared observable terminates (success or error)
      this.pending$.subscribe({
        error: () => (this.pending$ = null),
        complete: () => (this.pending$ = null),
      });
    }

    return this.pending$;
  }
}
