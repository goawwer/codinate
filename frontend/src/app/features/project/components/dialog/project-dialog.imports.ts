import { AsyncPipe } from '@angular/common';
import { AppPicture } from '../../../../common/picture/app-picture';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiCalendar,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiExpand,
  TuiIcon,
  TuiLabel,
  TuiTitle,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
  TuiHint,
} from '@taiga-ui/core';
import {
  TuiAccordion,
  TuiChevron,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiFilterByInputPipe,
  TuiInputChip,
  TuiMultiSelectGroupComponent,
  TuiMultiSelectGroupDirective,
  TuiInputDate,
  TuiSelect,
  TuiTab,
  TuiTabs,
  TuiStepper,
} from '@taiga-ui/kit';
import { TuiCell } from '@taiga-ui/layout';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';
import { ReleaseStatusPipe } from '../../../../common/pipes/release-status.pipe';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';
import { LowerCasePipe } from '@angular/common';

export const PROJECT_DIALOG_IMPORTS = [
  AsyncPipe,
  AppPicture,
  FormsModule,
  ReactiveFormsModule,
  TranslatePipe,
  TuiAccordion,
  TuiButton,
  TuiCell,
  TuiChevron,
  TuiDataList,
  TuiDataListWrapper,
  TuiError,
  TuiExpand,
  TuiFieldErrorPipe,
  TuiFilterByInputPipe,
  TuiCalendar,
  TuiDropdown,
  TuiIcon,
  TuiInputChip,
  TuiLabel,
  EmployeeRolePipe,
  ReleaseStatusPipe,
  TuiMultiSelectGroupComponent,
  TuiMultiSelectGroupDirective,
  TuiOptGroup,
  TuiOption,
  TuiSelect,
  TuiTab,
  TuiTabs,
  TuiStepper,
  TuiInputDate,
  TuiTextfield,
  TuiHint,
  TuiTitle,
  AppEditorComponent,
  LowerCasePipe,
];
