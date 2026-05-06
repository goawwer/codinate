import { FormsModule } from '@angular/forms';
import { PlanTileHeightDirective } from './plan-tile-height.directive';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiIcon, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge, TuiElasticContainer, TuiTiles } from '@taiga-ui/kit';
import { TuiLink } from '@taiga-ui/core';
import { TaskSuggestionsComponent } from '../../../task/components/task-suggestions/task-suggestions.component';

export const DAILYPLANIMPORTS = [
  FormsModule,
  RouterLink,
  TranslatePipe,
  TuiButton,
  TuiIcon,
  TuiLoader,
  TuiTextfield,
  TuiBadge,
  TuiElasticContainer,
  TuiTiles,
  TuiLink,
  PlanTileHeightDirective,
  TaskSuggestionsComponent,
];
