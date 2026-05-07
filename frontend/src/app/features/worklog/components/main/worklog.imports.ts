import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLoader,
  TuiTextfield,
  TuiLink,
} from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect, TuiElasticContainer } from '@taiga-ui/kit';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { TuiScrollbar } from '@taiga-ui/core';
import { TuiBlockStatus } from '@taiga-ui/layout';

export const WORKLOGIMPORTS = [
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLoader,
  TuiTextfield,
  TuiChevron,
  TuiDataListWrapper,
  TuiSelect,
  AppDatePipe,
  DecimalPipe,
  TranslatePipe,
  RouterLink,
  FormsModule,
  TuiLink,
  TuiElasticContainer,
  TuiScrollbar,
  TuiBlockStatus,
];
