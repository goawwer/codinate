import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiIcon, tuiLoaderOptionsProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { AppSize } from '../../../../core/declarations/tokens/size.token';
import { TeamStore } from '../../../team/store/team.store';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-teams',
  imports: [
    TuiTextfield,
    TuiIcon,
    FormsModule,
    AppPicture,
    AppDatePipe,
    RouterLink,
    TuiBlockStatus,
    TranslatePipe,
    TuiLoader,
  ],
  templateUrl: './teams.html',
  styleUrl: './teams.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    tuiLoaderOptionsProvider({
      size: 'l',
      inheritColor: false,
      overlay: true,
    }),
  ],
})
export class AllTeamsComponent implements OnInit {
  protected readonly inputSize: AppSize = 'm';
  private readonly store = inject(TeamStore);

  protected readonly searchQuery = signal('');
  protected readonly isLoading = this.store.isLoading;

  protected readonly filteredTeams = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const teams = this.store.teams();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.store.loadTeams();
  }
}
