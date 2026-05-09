import { TuiBadge, TuiTabs } from '@taiga-ui/kit';
import { TuiButton, TuiIcon, TuiHint, TuiTitle, TuiScrollbar } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppRankBadge } from '../../../../common/rank-badge/app-rank-badge';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiAxes, TuiBarChart, TuiRingChart } from '@taiga-ui/addon-charts';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';

export const PROFILEIMPORTS = [
  AppRankBadge,
  TuiBadge,
  TuiButton,
  TuiIcon,
  TuiTabs,
  RouterLink,
  EmployeeRolePipe,
  AppPicture,
  TuiBlockStatus,
  TranslatePipe,
  TuiAxes,
  TuiBarChart,
  TuiRingChart,
  TuiHint,
  AppDatePipe,
  TuiTitle,
  TuiScrollbar,
];
