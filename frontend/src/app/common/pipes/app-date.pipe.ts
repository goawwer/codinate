import { DatePipe, registerLocaleData } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import localeRu from '@angular/common/locales/ru';

registerLocaleData(localeRu, 'ru');

@Pipe({
  name: 'appDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  private readonly datePipe = new DatePipe('ru');

  transform(value: string | Date | null | undefined, format = 'dd MMM yyyy, HH:mm'): string {
    return this.datePipe.transform(value, format) ?? '—';
  }
}
