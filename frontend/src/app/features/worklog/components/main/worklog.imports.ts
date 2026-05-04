import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';

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
];
