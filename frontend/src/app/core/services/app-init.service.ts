import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../features/auth/store/auth.store';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  private readonly authStore = inject(AuthStore);
  private readonly translate = inject(TranslateService);

  init(): Promise<unknown> {
    return Promise.all([
      firstValueFrom(this.translate.use('ru')),
      this.authStore.restoreSession(),
    ]);
  }
}
