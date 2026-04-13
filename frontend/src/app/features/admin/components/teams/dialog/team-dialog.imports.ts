import { AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiError, TuiIcon, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { TuiFieldErrorPipe } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';

export const TEAM_DIALOG_IMPORTS = [
  AsyncPipe,
  FormsModule,
  ReactiveFormsModule,
  TranslatePipe,
  TuiButton,
  TuiError,
  TuiFieldErrorPipe,
  TuiForm,
  TuiIcon,
  TuiLabel,
  TuiTextfield,
];
