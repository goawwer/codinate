import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'releaseStatus', standalone: true })
export class ReleaseStatusPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(status: string | null | undefined): string {
    if (!status) return '—';
    const key = `models.release.statuses.${status.toLowerCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }
}
