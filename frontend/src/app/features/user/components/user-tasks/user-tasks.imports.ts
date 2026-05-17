import { DatePipe, LowerCasePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiDropdown, TuiIcon, TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge, TuiCalendarRange } from '@taiga-ui/kit';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TranslatePipe } from '@ngx-translate/core';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';
import { RouterLink } from '@angular/router';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';

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
  StripHtmlPipe,
  RouterLink,
  AppDatePipe,
];
