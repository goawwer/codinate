import { AsyncPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TuiButton,
  TuiCalendar,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiIcon,
  TuiLabel,
  TuiLink,
  TuiScrollbar,
  TuiTextfield,
  TuiTitle,
  TuiHint,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChevron,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiInputDate,
  TuiSelect,
  TuiBadgedContent,
  TuiTabs,
  TuiLineClamp,
} from '@taiga-ui/kit';
import { TuiBlockStatus, TuiCard, TuiHeader } from '@taiga-ui/layout';
import { TuiEditor } from '@taiga-ui/editor';
import { AppPicture } from '../../../../common/picture/app-picture';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';
import { CommentList } from '../../../../common/comment/comment-list/comment-list';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { SafeHtmlPipe } from '../../../../common/pipes/safe-html.pipe';
import { TaskCommentComposerComponent } from '../task-comment-composer/task-comment-composer';
import { MentionLinksDirective } from '../../../../common/directives/mention-link.directive';

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
  TuiCalendar,
  TuiDropdown,
  TuiFieldErrorPipe,
  TuiHeader,
  TuiIcon,
  TuiLabel,
  TuiLink,
  TuiScrollbar,
  TuiInputDate,
  TuiSelect,
  TuiTextfield,
  TuiTitle,
  AppPicture,
  TuiBadgedContent,
  TuiTabs,
  AppEditorComponent,
  CommentList,
  AppDatePipe,
  TaskCommentComposerComponent,
  SafeHtmlPipe,
  MentionLinksDirective,
  TuiLineClamp,
  TuiHint,
];
