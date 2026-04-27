import { TuiButton, TuiHint, TuiIcon, TuiLoader, TuiScrollbar } from '@taiga-ui/core';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiTabs } from '@taiga-ui/kit';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { TranslatePipe } from '@ngx-translate/core';

export const TEAMDETAILIMPORTS = [
  TuiButton,
  TuiHint,
  TuiIcon,
  TuiLoader,
  TuiScrollbar,
  TuiBlockStatus,
  TuiTabs,
  AppPicture,
  AppDatePipe,
  TranslatePipe,
] as const;
