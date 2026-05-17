import { ReactiveFormsModule } from '@angular/forms';
import { TuiEditor } from '@taiga-ui/editor';
import { MentionDropdownComponent } from './mention-dropdown.component';
import { TuiDropdown } from '@taiga-ui/core';

export const APP_EDITOR_IMPORTS = [
  ReactiveFormsModule,
  TuiEditor,
  MentionDropdownComponent,
  TuiDropdown,
];
