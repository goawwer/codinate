import { Injectable } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { TuiAlertService } from '@taiga-ui/core';
import { take } from 'rxjs';
import { PolymorpheusContent } from '@taiga-ui/polymorpheus';

export interface IAlertOptions<T = null> {
  autoClose: number;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly defaultOptions: Partial<IAlertOptions> = {
    autoClose: 5000,
  };

  private readonly alertService = inject(TuiAlertService);

  public error(content: PolymorpheusContent, options: Partial<IAlertOptions> = {}) {
    return this.alertService
      .open(content, {
        ...this.defaultOptions,
        ...options,
        appearance: 'negative',
      })
      .pipe(take(1))
      .subscribe();
  }

  public success(content: PolymorpheusContent, options: Partial<IAlertOptions> = {}) {
    return this.alertService
      .open(content, {
        autoClose: 3000,
        ...options,
        appearance: 'success',
      })
      .pipe(take(1))
      .subscribe();
  }

  public notification(content: PolymorpheusContent, label?: string) {
    return this.alertService
      .open(content, {
        autoClose: 5000,
        appearance: 'info',
        label,
      })
      .pipe(take(1))
      .subscribe();
  }
}
