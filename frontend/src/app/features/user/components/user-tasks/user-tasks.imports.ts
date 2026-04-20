import { DatePipe, LowerCasePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButton,
  TuiDropdown,
  TuiIcon,
  TuiScrollbar,
  TuiTextfield,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiCalendarRange,
} from '@taiga-ui/kit';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TranslatePipe } from '@ngx-translate/core';

export const USERTASKSIMPORTS = [
  DatePipe,
  LowerCasePipe,
  ReactiveFormsModule,
  TuiScrollbar,
  TuiButton,
  TuiDropdown,
  TuiIcon,
  TuiBadge,
  TuiCalendarRange,
  TuiBlockStatus,
  TranslatePipe,
  TuiTextfield,
];
