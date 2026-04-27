import { DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLink,
  TuiOptGroup,
  TuiOption,
  TuiScrollbar,
  TuiTextfield,
  TuiHint,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiButtonSelect,
  TuiCalendarRange,
  TuiMultiSelect,
  TuiSegmented,
  TuiStatus,
} from '@taiga-ui/kit';
import { TuiBlockStatus, TuiSearch } from '@taiga-ui/layout';
import { TranslatePipe } from '@ngx-translate/core';
import { LowerCasePipe } from '@angular/common';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';

export const FEEDIMPORTS = [
  DatePipe,
  ReactiveFormsModule,
  RouterLink,
  TuiScrollbar,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLink,
  TuiOptGroup,
  TuiOption,
  TuiBadge,
  TuiButtonSelect,
  TuiCalendarRange,
  TuiMultiSelect,
  TuiSegmented,
  TuiStatus,
  TuiBlockStatus,
  TuiSearch,
  TranslatePipe,
  TuiTextfield,
  LowerCasePipe,
  TuiHint,
  StripHtmlPipe,
];
