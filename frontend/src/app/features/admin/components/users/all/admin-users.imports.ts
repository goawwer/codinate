import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { TuiTable, TuiTableControl, TuiTableExpand } from '@taiga-ui/addon-table';
import {
  TuiAutoColorPipe,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiHint,
  TuiIcon,
  TuiInitialsPipe,
  TuiLink,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiAvatar,
  TuiBadge,
  TuiCheckbox,
  TuiChip,
  TuiItemsWithMore,
  TuiProgressBar,
  TuiRadioList,
  TuiSelect,
  TuiStatus,
  TuiDataListWrapper,
  TuiChevron,
  TuiLineClamp,
} from '@taiga-ui/kit';
import { TuiCell, TuiBlockStatus } from '@taiga-ui/layout';
import { AppDatePipe } from '../../../../../common/pipes/app-date.pipe';
import { FormatMinutesPipe } from '../../../../../common/pipes/format-minutes.pipe';
import { UserStatus } from '../../../../../common/user-status/user-status';
import { TranslatePipe } from '@ngx-translate/core';
import { EmployeeRolePipe } from '../../../../../common/pipes/employee-role.pipe';
import { TuiHintDirective } from '@taiga-ui/core';

export const USERSDASHBOARDIMPORTS = [
  AppDatePipe,
  FormatMinutesPipe,
  TitleCasePipe,
  TuiAutoColorPipe,
  TuiDataList,
  TuiHint,
  TuiAvatar,
  TuiBadge,
  TuiButton,
  TuiCell,
  TuiCheckbox,
  TuiChip,
  TuiDropdown,
  TuiIcon,
  TuiInitialsPipe,
  TuiItemsWithMore,
  TuiLink,
  TuiProgressBar,
  TuiRadioList,
  TuiSelect,
  TuiStatus,
  TuiTable,
  TuiTableControl,
  TuiTableExpand,
  TuiTextfield,
  TuiTitle,
  UserStatus,
  FormsModule,
  TranslatePipe,
  TuiBlockStatus,
  TuiHintDirective,
  EmployeeRolePipe,
  TuiDataListWrapper,
  TuiChevron,
  TuiLineClamp,
];
