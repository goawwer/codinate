import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiHint,
  TuiHintDirective,
  TuiIcon,
  TuiLoader,
  TuiOption,
  TuiScrollbar,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiTabs } from '@taiga-ui/kit';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';
import { TranslatePipe } from '@ngx-translate/core';
import { SafeHtmlPipe } from '../../../../common/pipes/safe-html.pipe';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';
import { MentionLinksDirective } from '../../../../common/directives/mention-link.directive';

export const TEAMDETAILIMPORTS = [
  ReactiveFormsModule,
  RouterLink,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiHint,
  TuiHintDirective,
  TuiIcon,
  TuiLoader,
  TuiOption,
  TuiScrollbar,
  TuiTextfield,
  TuiBlockStatus,
  TuiTabs,
  AppPicture,
  AppDatePipe,
  AppEditorComponent,
  TranslatePipe,
  SafeHtmlPipe,
  StripHtmlPipe,
  MentionLinksDirective,
] as const;
