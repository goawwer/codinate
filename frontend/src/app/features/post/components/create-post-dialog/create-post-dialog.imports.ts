import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiButtonSelect, TuiMultiSelect } from '@taiga-ui/kit';
import { AppPicture } from '../../../../common/picture/app-picture';
import { TranslatePipe } from '@ngx-translate/core';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';

export const CREATE_POST_DIALOG_IMPORTS = [
  ReactiveFormsModule,
  TuiButton,
  TuiButtonSelect,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiMultiSelect,
  TuiOptGroup,
  TuiOption,
  TuiTextfield,
  AppPicture,
  TranslatePipe,
  AppEditorComponent,
] as const;
