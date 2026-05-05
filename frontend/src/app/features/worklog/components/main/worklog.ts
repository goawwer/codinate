import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { filter } from 'rxjs';
import { WorklogService } from '../../service/worklog.service';
import { TranslateService } from '@ngx-translate/core';
import { UserStore } from '../../../user/store/user.store';
import { WorklogStore } from '../../store/worklog.store';
import { ProjectStore } from '../../../project/store/project.store';
import { Project } from '../../../project/types/model/project.model';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { WorklogDialogComponent } from '../dialog/worklog-dialog.component';
import { WorklogDialogData, WorklogRow } from '../../types/worklog.model';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { WORKLOGIMPORTS } from './worklog.imports';

export type WorklogPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const PAGE_SIZE = 10;

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
  private readonly worklogService = inject(WorklogService);

  readonly periods: WorklogPeriod[] = ['today', 'yesterday', 'week', 'month', 'all'];
  readonly selectedPeriod = signal<WorklogPeriod>('today');
  readonly stringifyPeriod = (p: WorklogPeriod): string =>
    this.translate.instant(PERIOD_I18N_KEYS[p]);

  protected readonly ALL_PROJECTS = { id: 0 } as Project;

  readonly selectedProject = signal<Project>(this.ALL_PROJECTS);
  readonly stringifyProject = (p: Project): string =>
    p.id ? p.projectName : this.translate.instant('models.worklog.allProjects');

  readonly projectItems = computed<Project[]>(() => [
    this.ALL_PROJECTS,
    ...this.projectStore.projects(),
  ]);

  readonly sortCol = signal<'date' | 'startAt' | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(0);

  readonly filteredLogs = computed(() => {
    const col = this.sortCol();
    const dir = this.sortDir();
    let logs = [...this.store.logs()];

    if (col) {
      logs = logs.sort((a, b) => {
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

  readonly totalPages = computed(() => Math.ceil(this.filteredLogs().length / PAGE_SIZE));
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));
  readonly pagedLogs = computed(() => {
    const page = this.currentPage();
    return this.filteredLogs().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  });
  readonly pageHours = computed(
    () => this.pagedLogs().reduce((sum, l) => sum + l.totalMinutes, 0) / 60,
  );

  readonly expandedDescriptions = signal<Set<string>>(new Set());
  readonly descriptionLimit = 180;

  constructor() {
    this.projectStore.loadProjects();

    effect(() => {
      const userId = this.userStore.user()?.id;
      if (!userId) return;
      const projectId = this.selectedProject().id || undefined;
      this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()), projectId });
    });

    effect(() => {
      this.filteredLogs();
      this.currentPage.set(0);
    }, { allowSignalWrites: true });
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected selectProject(project: Project | null): void {
    this.selectedProject.set(project ?? this.ALL_PROJECTS);
  }

  protected toggleSort(col: 'date' | 'startAt'): void {
    if (this.sortCol() === col) {
      if (this.sortDir() === 'asc') {
        this.sortDir.set('desc');
      } else {
        this.sortCol.set(null);
        this.sortDir.set('asc');
      }
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
        const projectId = this.selectedProject().id || undefined;
        this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()), projectId });
      });
  }

  protected openEditDialog(log: WorklogRow): void {
    const userId = this.userStore.user()?.id;
    if (!userId) return;

    this.dialogs
      .component<WorklogDialogComponent, boolean, WorklogDialogData>(WorklogDialogComponent, {
        label: this.translate.instant('models.worklog.editTime'),
        size: 'm',
        data: {
          logId: log.id,
          taskId: log.taskId || undefined,
          taskIdentifier: log.taskIdentifier || undefined,
          startAt: log.startAt,
          endAt: log.endAt,
          description: log.description,
        },
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        const projectId = this.selectedProject().id || undefined;
        this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()), projectId });
      });
  }

  protected deleteLog(log: WorklogRow): void {
    const userId = this.userStore.user()?.id;
    if (!userId) return;
    const model = this.translate.instant('models.worklog.title').toLowerCase();

    this.dialogs
      .confirm({
        label: this.translate.instant('generic.actions.deleteConfirm', { model }).trim(),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.worklogService.delete(log.id).subscribe({
          next: () => {
            const projectId = this.selectedProject().id || undefined;
            this.store.loadLogs({ userId, params: this.buildParams(this.selectedPeriod()), projectId });
          },
        });
      });
  }

  protected isDescriptionLong(description: string): boolean {
    return description.length > this.descriptionLimit;
  }

  protected visibleDescription(log: WorklogRow): string {
    if (!log.description) {
      return '';
    }

    if (this.expandedDescriptions().has(log.id)) {
      return log.description;
    }

    if (log.description.length <= this.descriptionLimit) {
      return log.description;
    }

    return `${log.description.slice(0, this.descriptionLimit).trim()}…`;
  }

  protected toggleDescription(id: string): void {
    this.expandedDescriptions.update((ids) => {
      const next = new Set(ids);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  private buildParams(period: WorklogPeriod): HttpParams {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let from: Date | null = null;
    let to: Date | null = null;

    switch (period) {
      case 'today':
        from = todayStart;
        to = todayStart;
        break;
      case 'yesterday': {
        const y = new Date(todayStart);
        y.setDate(y.getDate() - 1);
        from = y;
        to = y;
        break;
      }
      case 'week': {
        const w = new Date(todayStart);
        w.setDate(w.getDate() - 6);
        from = w;
        to = todayStart;
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = todayStart;
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
