import { Injectable } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { AlertService } from '../services/alert.service';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WithErrorAlertOperator {
  private readonly alertService = inject(AlertService);

  public call<T>(content: string): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) =>
      source$.pipe(
        catchError(({ message }: { message: string }) => {
          const msg = `${content}: ${message || 'Неизвестная ошибка'}`;

          this.alertService.error(msg);

          return EMPTY;
        }),
      );
  }
}
