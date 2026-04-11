import { Injectable } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { TuiAlertService } from '@taiga-ui/core';
import { first } from 'rxjs';
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
      .pipe(first())
      .subscribe();
  }

  public success(content: PolymorpheusContent, options: Partial<IAlertOptions> = {}) {
    return this.alertService
      .open(content, {
        ...this.defaultOptions,
        ...options,
        appearance: 'success',
      })
      .pipe(first())
      .subscribe();
  }
}
