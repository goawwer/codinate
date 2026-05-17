import { DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AppPicture } from '../../../../common/picture/app-picture';
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
  TuiTabs,
  TuiCarousel,
  TuiPagination,
  TuiLineClamp,
} from '@taiga-ui/kit';
import { TuiBlockStatus, TuiSearch } from '@taiga-ui/layout';
import { TuiAxes, TuiBarChart, TuiRingChart } from '@taiga-ui/addon-charts';
import { TranslatePipe } from '@ngx-translate/core';
import { LowerCasePipe } from '@angular/common';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { AppRankBadge } from '../../../../common/rank-badge/app-rank-badge';

export const FEEDIMPORTS = [
  AppPicture,
  AppRankBadge,
  DatePipe,
  DecimalPipe,
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
  TuiTabs,
  TuiBlockStatus,
  TuiSearch,
  TranslatePipe,
  TuiTextfield,
  LowerCasePipe,
  TuiHint,
  StripHtmlPipe,
  AppDatePipe,
  AppRankBadge,
  TuiCarousel,
  TuiPagination,
  TuiAxes,
  TuiBarChart,
  TuiRingChart,
  TuiLineClamp,
];
