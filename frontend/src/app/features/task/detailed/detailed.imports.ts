import { AsyncPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiDataList,
  TuiError,
  TuiIcon,
  TuiLabel,
  TuiLink,
  TuiScrollbar,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChevron,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiSelect,
  TuiBadgedContent,
} from '@taiga-ui/kit';
import { TuiBlockStatus, TuiCard, TuiHeader } from '@taiga-ui/layout';
import { TuiEditor } from '@taiga-ui/editor';
import { AppPicture } from '../../../common/picture/app-picture';
import { EmployeeRolePipe } from '../../../common/pipes/employee-role.pipe';
import { AppEditorComponent } from '../../../common/editor/app-editor.component';

export const DETAILED_IMPORTS = [
  AsyncPipe,
  DatePipe,
  ReactiveFormsModule,
  TranslatePipe,
  EmployeeRolePipe,
  TuiBadge,
  TuiBlockStatus,
  TuiButton,
  TuiCard,
  TuiChevron,
  TuiDataList,
  TuiDataListWrapper,
  TuiEditor,
  TuiError,
  TuiFieldErrorPipe,
  TuiHeader,
  TuiIcon,
  TuiLabel,
  TuiLink,
  TuiScrollbar,
  TuiSelect,
  TuiTextfield,
  TuiTitle,
  AppPicture,
  TuiBadgedContent,
  AppEditorComponent,
];
