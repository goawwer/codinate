import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  TuiButton,
  TuiIcon,
  TuiLoader,
  TuiScrollbar,
  TuiTextfield,
  TuiDropdown,
  TuiOption,
  TuiDataList,
} from '@taiga-ui/core';
import { TuiBadge, TuiProgress, TuiTabs } from '@taiga-ui/kit';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TranslatePipe } from '@ngx-translate/core';
import { EmployeeRolePipe } from '../../../../common/pipes/employee-role.pipe';
import { SafeHtmlPipe } from '../../../../common/pipes/safe-html.pipe';
import { ReleaseStatusPipe } from '../../../../common/pipes/release-status.pipe';
import { MentionLinksDirective } from '../../../../common/directives/mention-link.directive';
import { TuiHint, TuiHintDirective } from '@taiga-ui/core';
import { StripHtmlPipe } from '../../../../common/pipes/strip-html.pipe';

export const PROJECTDETAILSIMPORTS = [
  ReactiveFormsModule,
  RouterLink,
  DatePipe,
  TuiButton,
  TuiIcon,
  TuiLoader,
  TuiScrollbar,
  TuiTextfield,
  TuiBadge,
  TuiBlockStatus,
  TuiProgress,
  TuiTabs,
  AppPicture,
  AppDatePipe,
  AppEditorComponent,
  TuiBlockStatus,
  TranslatePipe,
  EmployeeRolePipe,
  ReleaseStatusPipe,
  TuiHint,
  TuiHintDirective,
  SafeHtmlPipe,
  StripHtmlPipe,
  TuiDropdown,
  TuiOption,
  TuiDataList,
  MentionLinksDirective,
] as const;
