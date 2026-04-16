import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../../common/dialogs/dialog.service';
import { Team } from '../../../../team/types/model/team.model';
import { TeamStore } from '../../../../team/store/team.store';
import { TEAMSDASHBOARDIMPORTS } from './admin-teams.imports';
import { APP_SIZE, AppSize } from '../../../../../core/declarations/tokens/size.token';
import { TeamDialogComponent, TeamDialogData } from '../dialog/team-dialog.component';

type Column = {
  key: keyof Team;
  isDate?: boolean;
  isMembers?: boolean;
  width?: string;
};

@Component({
  selector: 'app-admin-teams',
  imports: [TEAMSDASHBOARDIMPORTS],
  providers: [{ provide: APP_SIZE, useValue: 'l' }],
  templateUrl: './admin-teams.html',
  styleUrl: './admin-teams.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTeams implements OnInit {
  readonly store = inject(TeamStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly tableSize = inject(APP_SIZE);
  protected readonly inputSize: AppSize = 'm';

  protected readonly columns: Column[] = [
    { key: 'name', width: '10rem' },
    { key: 'description', width: '14rem' },
    { key: 'members', isMembers: true, width: '10rem' },
    { key: 'createdAt', isDate: true, width: '10rem' },
    { key: 'updatedAt', isDate: true, width: '10rem' },
  ];

  protected readonly searchQuery = signal('');
  protected readonly filteredTeams = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const teams = this.store.teams();
    if (!q) return teams;

    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  });

  protected readonly selectedIds = signal(new Set<number>());
  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);

  protected isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  protected toggleTeam(id: number, checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    this.selectedIds.update(() => {
      if (!checked) return new Set<number>();
      return new Set(this.filteredTeams().map((t) => t.id));
    });
  }

  protected allSelected(): boolean {
    const teams = this.filteredTeams();
    return teams.length > 0 && teams.every((t) => this.selectedIds().has(t.id));
  }

  protected openCreateDialog(): void {
    this.dialogs
      .component<TeamDialogComponent, void, TeamDialogData>(TeamDialogComponent, {
        label: this.translate.instant('admin.dashboard.teams.dialogs.createTitle'),
        size: 'l',
        data: { team: null },
      })
      .subscribe();
  }

  protected openEditDialog(team: Team): void {
    this.dialogs
      .component<TeamDialogComponent, void, TeamDialogData>(TeamDialogComponent, {
        label: this.translate.instant('admin.dashboard.teams.dialogs.editTitle'),
        size: 'l',
        data: { team },
      })
      .subscribe();
  }

  protected confirmDelete(): void {
    const count = this.selectedIds().size;
    this.dialogs
      .confirm({
        label: this.translate.instant('admin.dashboard.teams.dialogs.deleteTitle'),
        content: this.translate.instant('admin.dashboard.teams.dialogs.deleteContent', { count }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.deleteTeams([...this.selectedIds()]);
        this.selectedIds.set(new Set());
      });
  }

  ngOnInit(): void {
    this.store.loadTeams();
  }
}
