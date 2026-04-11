import { inject, Injectable } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { Observable } from 'rxjs';

export interface ConfirmOptions {
  label: string;
  content: string;
  yes?: string;
  no?: string;
  size?: 's' | 'm' | 'l' | 'fullscreen';
}

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  private readonly dialogs = inject(TuiDialogService);

  confirm(options: ConfirmOptions): Observable<boolean> {
    return this.dialogs.open<boolean>(TUI_CONFIRM, {
      label: options.label,
      size: options.size ?? 's',
      data: {
        content: options.content,
        yes: options.yes,
        no: options.no,
      } satisfies TuiConfirmData,
    });
  }
}
