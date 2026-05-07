import { TuiBadge, TuiTabs } from '@taiga-ui/kit';
import { TuiButton, TuiIcon, TuiHint } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';
import { AppPicture } from '../../../../common/picture/app-picture';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiAxes, TuiBarChart, TuiRingChart } from '@taiga-ui/addon-charts';

export const PROFILEIMPORTS = [
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
];
