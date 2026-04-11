import { Component, Input } from '@angular/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-user-status',
  standalone: true,
  imports: [TuiBadge, TranslatePipe],
  template: `
    @if (disabled) {
      <tui-badge appearance="error">{{ 'generic.statuses.disabled' | translate }}</tui-badge>
    } @else {
      <tui-badge appearance="success">{{ 'generic.statuses.active' | translate }}</tui-badge>
    }
  `,
})
export class UserStatus {
  @Input() disabled = false;
}
