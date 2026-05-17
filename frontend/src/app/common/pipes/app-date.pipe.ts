import { DatePipe, registerLocaleData } from '@angular/common';
import { ChangeDetectorRef, inject, Pipe, PipeTransform } from '@angular/core';
import localeRu from '@angular/common/locales/ru';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

registerLocaleData(localeRu, 'ru');

@Pipe({
  name: 'appDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly sub: Subscription;
  private currentLang = this.normalizeLang(this.translate.getCurrentLang() || 'ru');

  constructor() {
    this.sub = this.translate.onLangChange.subscribe(({ lang }) => {
      this.currentLang = this.normalizeLang(lang);
      this.cdr.markForCheck();
    });
  }

  transform(value: string | Date | null | undefined, format = 'dd MMM yyyy, HH:mm'): string {
    if (!value) return '—';

    return new DatePipe(this.currentLang).transform(value, format) ?? '—';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private normalizeLang(lang: string): 'ru' | 'en' {
    return lang.startsWith('ru') ? 'ru' : 'en';
  }
}
