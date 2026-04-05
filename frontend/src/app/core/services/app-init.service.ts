import { inject, Injectable } from '@angular/core';
import { AuthStore } from '../../features/auth/store/auth.store';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  private readonly authStore = inject(AuthStore);

  init(): Promise<void> {
    return this.authStore.restoreSession();
  }
}
