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
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';
import { SafeHtmlPipe } from '../../../../common/pipes/safe-html.pipe';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CommentList } from '../../../../common/comment/comment-list/comment-list';
import { MentionLinksDirective } from '../../../../common/directives/mention-link.directive';

export const POST_DIALOG_IMPORTS = [
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
  AppDatePipe,
  StripHtmlPipe,
  SafeHtmlPipe,
  AppEditorComponent,
  TranslatePipe,
  CommentList,
  MentionLinksDirective,
] as const;
