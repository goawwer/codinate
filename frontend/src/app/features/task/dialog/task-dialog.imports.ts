import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiDataList,
  TuiError,
  TuiLabel,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
  TuiIcon,
} from '@taiga-ui/core';
import {
  TuiChevron,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiSelect,
  TuiStepper,
} from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';

export const TASK_DIALOG_IMPORTS = [
  AsyncPipe,
  ReactiveFormsModule,
  TranslatePipe,
  TuiButton,
  TuiChevron,
  TuiDataList,
  TuiDataListWrapper,
  TuiError,
  TuiFieldErrorPipe,
  TuiForm,
  TuiLabel,
  TuiOptGroup,
  TuiOption,
  TuiSelect,
  TuiTextfield,
  TuiIcon,
  TuiStepper,
];
