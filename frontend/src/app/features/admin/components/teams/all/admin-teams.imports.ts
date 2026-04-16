import { FormsModule } from '@angular/forms';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiButton, TuiDropdown, TuiHint, TuiIcon, TuiLink, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge, TuiCheckbox, TuiItemsWithMore, TuiStatus } from '@taiga-ui/kit';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { AppDatePipe } from '../../../../../common/pipes/app-date.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiHintDirective } from '@taiga-ui/core';

export const TEAMSDASHBOARDIMPORTS = [
  AppDatePipe,
  TuiHint,
  TuiBadge,
  TuiButton,
  TuiCheckbox,
  TuiDropdown,
  TuiHintDirective,
  TuiIcon,
  TuiItemsWithMore,
  TuiLink,
  TuiStatus,
  TuiTable,
  TuiTextfield,
  FormsModule,
  TranslatePipe,
  TuiBlockStatus,
];
