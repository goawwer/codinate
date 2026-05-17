import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiHint,
  TuiLabel,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiFieldErrorPipe } from '@taiga-ui/kit';
import { AppPicture } from '../../../../common/picture/app-picture';
import { TuiFlagPipe } from '@taiga-ui/core/pipes/flag';
import { TuiBadge } from '@taiga-ui/kit/components/badge';
import { TuiBadgedContent } from '@taiga-ui/kit/components/badged-content';
import { TuiButtonSelect } from '@taiga-ui/kit/directives/button-select';

export const PROFILE_DIALOG_IMPORTS = [
  AsyncPipe,
  AppPicture,
  ReactiveFormsModule,
  TranslatePipe,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiFieldErrorPipe,
  TuiHint,
  TuiLabel,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
  TuiBadge,
  TuiBadgedContent,
  TuiButtonSelect,
  TuiFlagPipe,
];
