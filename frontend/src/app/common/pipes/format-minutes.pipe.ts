import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'formatMinutes',
  standalone: true,
  pure: false,
})
export class FormatMinutesPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(minutes: number): string {
    const h = this.translate.instant('generic.time.hoursShort');
    const m = this.translate.instant('generic.time.minutesShort');
    if (minutes <= 0) return `0${h}`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}${m}`;
    if (!rest) return `${hours}${h}`;
    return `${hours}${h} ${rest}${m}`;
  }
}
