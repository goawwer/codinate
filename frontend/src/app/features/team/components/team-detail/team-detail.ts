import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { TeamStore } from '../../store/team.store';
import { UserStore } from '../../../user/store/user.store';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import {
  TeamDialogComponent,
  TeamDialogData,
} from '../../../admin/components/teams/dialog/team-dialog.component';
import { TEAMDETAILIMPORTS } from './team-detail.imports';

@Component({
  selector: 'app-team-detail',
  imports: [TEAMDETAILIMPORTS],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [tuiScrollbarOptionsProvider({ mode: 'hover' })],
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamStore = inject(TeamStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);

  protected readonly routeId = toSignal(this.route.params.pipe(map((p) => p['id'] as string)));
  protected readonly numericId = computed(() => {
    const id = this.routeId();
    return id ? +id : null;
  });

  protected readonly isLoading = this.teamStore.isLoading;
  protected readonly activeTab = signal(0);

  protected readonly team = computed(() => {
    const id = this.numericId();
    if (!id) return null;
    return this.teamStore.teams().find((t) => t.id === id) ?? null;
  });

  ngOnInit(): void {
    this.teamStore.loadTeams();
  }

  protected openEditDialog(): void {
    const t = this.team();
    if (!t) return;
    this.dialogs
      .component<TeamDialogComponent, void, TeamDialogData>(TeamDialogComponent, {
        label: this.translate.instant('admin.dashboard.teams.dialogs.editTitle'),
        size: 'l',
        data: { team: t },
      })
      .subscribe();
  }
}
