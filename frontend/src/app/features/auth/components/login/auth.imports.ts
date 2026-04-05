import { AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiAppearance,
  TuiButton,
  TuiError,
  TuiIcon,
  TuiLabel,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiFieldErrorPipe, TuiTooltip } from '@taiga-ui/kit';
import { TuiCardLarge, TuiForm, TuiHeader } from '@taiga-ui/layout';

export const LOGINIMPORTS = [
  AsyncPipe,
  TuiIcon,
  ReactiveFormsModule,
  TuiTextfield,
  FormsModule,
  TuiLabel,
  TuiTooltip,
  TuiError,
  TuiFieldErrorPipe,
  TranslatePipe,
  TuiButton,
  TuiCardLarge,
  TuiForm,
  TuiHeader,
  TuiAppearance,
];
