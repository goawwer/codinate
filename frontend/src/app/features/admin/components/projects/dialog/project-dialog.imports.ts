import { AsyncPipe } from '@angular/common';
import { AppPicture } from '../../../../../common/picture/app-picture';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiDataList,
  TuiError,
  TuiIcon,
  TuiLabel,
  TuiTitle,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
  TuiHint,
} from '@taiga-ui/core';
import {
  TuiChevron,
  TuiFieldErrorPipe,
  TuiFilterByInputPipe,
  TuiInputChip,
  TuiMultiSelectGroupComponent,
  TuiMultiSelectGroupDirective,
  TuiTab,
  TuiTabs,
} from '@taiga-ui/kit';
import { EmployeeRolePipe } from '../../../../../common/pipes/employee-role.pipe';

export const PROJECT_DIALOG_IMPORTS = [
  AsyncPipe,
  AppPicture,
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
  TuiHint,
  TuiTitle,
];
