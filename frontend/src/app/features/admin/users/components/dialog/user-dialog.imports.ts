import { AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiDataList, TuiError, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import {
  TuiCheckbox,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiSelect,
  TuiChevron,
} from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { EmployeeRolePipe } from '../../../../../common/pipes/employee-role.pipe';

export const USER_DIALOG_IMPORTS = [
  AsyncPipe,
  FormsModule,
  ReactiveFormsModule,
  TranslatePipe,
  EmployeeRolePipe,
  TuiButton,
  TuiCheckbox,
  TuiDataList,
  TuiDataListWrapper,
  TuiError,
  TuiFieldErrorPipe,
  TuiForm,
  TuiLabel,
  TuiSelect,
  TuiTextfield,
  TuiChevron,
];
