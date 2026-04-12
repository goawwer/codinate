import { INJECTOR, inject, Injectable, Type } from '@angular/core';
import { TuiDialogContext, TuiDialogOptions, TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import { Observable } from 'rxjs';

export interface ConfirmOptions {
  label: string;
  content?: PolymorpheusContent;
  yes?: string;
  no?: string;
  size?: 's' | 'm' | 'l' | 'fullscreen';
}

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  private readonly dialogs = inject(TuiDialogService);
  private readonly injector = inject(INJECTOR);

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

  open<R = void, D = void>(
    content: PolymorpheusContent<TuiDialogContext<R, D>>,
    options?: Partial<TuiDialogOptions<D>>,
  ): Observable<R> {
    return this.dialogs.open<R>(content, options);
  }

  component<T, R = void, D = void>(
    component: Type<T>,
    options?: Partial<TuiDialogOptions<D>>,
  ): Observable<R> {
    return this.dialogs.open<R>(
      new PolymorpheusComponent(component, this.injector) as PolymorpheusContent<TuiDialogContext<R, D>>,
      options,
    );
  }
}
