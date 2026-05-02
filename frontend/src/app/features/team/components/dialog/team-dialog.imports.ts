import { AsyncPipe } from '@angular/common';
import { AppPicture } from '../../../../common/picture/app-picture';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiDataList,
  TuiError,
  TuiHint,
  TuiIcon,
  TuiLabel,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
} from '@taiga-ui/core';
import {
  TuiChevron,
  TuiFieldErrorPipe,
  TuiFilterByInputPipe,
  TuiInputChip,
  TuiMultiSelectGroupComponent,
  TuiMultiSelectGroupDirective,
  TuiCheckbox,
  TuiSelect,
  TuiTab,
  TuiTabs,
} from '@taiga-ui/kit';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';

export const TEAM_DIALOG_IMPORTS = [
  AppPicture,
  AsyncPipe,
  FormsModule,
  ReactiveFormsModule,
  TranslatePipe,
  TuiButton,
  TuiChevron,
  TuiDataList,
  TuiError,
  TuiFieldErrorPipe,
  TuiFilterByInputPipe,
  TuiIcon,
  TuiInputChip,
  TuiLabel,
  EmployeeRolePipe,
  TuiMultiSelectGroupComponent,
  TuiMultiSelectGroupDirective,
  TuiOptGroup,
  TuiOption,
  TuiTab,
  TuiTabs,
  TuiTextfield,
  TuiCheckbox,
  TuiHint,
  TuiSelect,
];
