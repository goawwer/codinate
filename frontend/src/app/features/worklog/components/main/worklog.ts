import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserStore } from '../../../user/store/user.store';
import { WorklogStore } from '../../store/worklog.store';
import { ProjectStore } from '../../../project/store/project.store';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { WorklogDialogComponent } from '../dialog/worklog-dialog.component';
import { WorklogDialogData } from '../../types/worklog.model';
import { WORKLOGIMPORTS } from './worklog.imports';

export type WorklogPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const PERIOD_I18N_KEYS: Record<WorklogPeriod, string> = {
  today: 'generic.timePeriods.today',
  yesterday: 'generic.timePeriods.yesterday',
  week: 'generic.timePeriods.thisWeek',
  month: 'generic.timePeriods.thisMonth',
  all: 'generic.timePeriods.allTime',
};

@Component({
  selector: 'app-worklog',
  imports: [WORKLOGIMPORTS],
  templateUrl: './worklog.html',
  styleUrl: './worklog.scss',
})
export class WorklogComponent {
  private readonly userStore = inject(UserStore);
  protected readonly store = inject(WorklogStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);

  readonly periods: WorklogPeriod[] = ['today', 'yesterday', 'week', 'month', 'all'];
  readonly selectedPeriod = signal<WorklogPeriod>('today');
  readonly stringifyPeriod = (p: WorklogPeriod): string =>
    this.translate.instant(PERIOD_I18N_KEYS[p]);

  readonly selectedProjectName = signal<string>('');
  readonly stringifyProject = (p: string): string =>
    p || this.translate.instant('models.worklog.allProjects');

  readonly projectItems = computed<string[]>(() => [
    '',
    ...this.projectStore
      .projects()
      .map((p) => p.projectName)
      .sort(),
  ]);

  readonly sortCol = signal<'date' | 'startAt' | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly filteredLogs = computed(() => {
    const project = this.selectedProjectName();
    const col = this.sortCol();
    const dir = this.sortDir();

    let logs = project
      ? this.store.logs().filter((l) => l.projectName === project)
      : [...this.store.logs()];

    if (col) {
      logs = [...logs].sort((a, b) => {
        const av = new Date(a[col]).getTime();
        const bv = new Date(b[col]).getTime();
        return dir === 'asc' ? av - bv : bv - av;
      });
    }

    return logs;
  });

  readonly totalHours = computed(
    () => this.filteredLogs().reduce((sum, l) => sum + l.totalMinutes, 0) / 60,
  );

  constructor() {
    this.projectStore.loadProjects();

    effect(() => {
      const userId = this.userStore.user()?.id;
      if (!userId) return;
      this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()) });
    });
  }

  protected toggleSort(col: 'date' | 'startAt'): void {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
  }

  protected openLogDialog(): void {
    const userId = this.userStore.user()?.id;
    if (!userId) return;

    this.dialogs
      .component<WorklogDialogComponent, boolean, WorklogDialogData>(WorklogDialogComponent, {
        label: this.translate.instant('models.worklog.logTime'),
        size: 'm',
        data: {},
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()) });
      });
  }

  private buildParams(period: WorklogPeriod): HttpParams {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86_400_000;

    let from: Date | null = null;
    let to: Date | null = null;

    switch (period) {
      case 'today':
        from = todayStart;
        to = new Date(todayStart.getTime() + dayMs - 1);
        break;
      case 'yesterday': {
        const y = new Date(todayStart);
        y.setDate(y.getDate() - 1);
        from = y;
        to = new Date(y.getTime() + dayMs - 1);
        break;
      }
      case 'week': {
        const w = new Date(todayStart);
        w.setDate(w.getDate() - 6);
        from = w;
        to = new Date(todayStart.getTime() + dayMs - 1);
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(todayStart.getTime() + dayMs - 1);
        break;
      case 'all':
        break;
    }

    let params = new HttpParams().set('sortBy', 'date').set('sort', 'desc');
    if (from) params = params.set('from', from.toISOString());
    if (to) params = params.set('to', to.toISOString());
    return params;
  }
}
