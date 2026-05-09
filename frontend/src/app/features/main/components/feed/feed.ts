import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { debounceTime, filter, forkJoin, startWith } from 'rxjs';
import { FEEDIMPORTS } from './feed.imports';
import { Task } from '../../../task/types/task.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { TaskStatus, TaskStatusesService } from '../../../task/service/task-statuses.service';
import { TaskPriority, TaskPrioritiesService } from '../../../task/service/task-priorities.service';
import { ProjectApiService } from '../../../project/service/project.service';
import { Project } from '../../../project/types/model/project.model';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { TaskDialogComponent } from '../../../task/components/dialog/task-dialog.component';
import { WorklogService } from '../../../worklog/service/worklog.service';
import { LeaderboardEntry } from '../../../worklog/types/worklog.model';

const PAGE_SIZE = 10;

type Segment = '' | 'Open' | 'Closed';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-feed',
  imports: [FEEDIMPORTS],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [tuiScrollbarOptionsProvider({ mode: 'hover' })],
})
export class MainFeedComponent implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  private readonly statusesService = inject(TaskStatusesService);
  private readonly prioritiesService = inject(TaskPrioritiesService);
  private readonly projectsService = inject(ProjectApiService);
  private readonly translate = inject(TranslateService);
  private readonly dialogService = inject(AppDialogService);

  private readonly worklogService = inject(WorklogService);

  protected readonly currentPage = signal(0);
  protected readonly allTasks = signal<Task[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly statuses = signal<TaskStatus[]>([]);
  protected readonly priorities = signal<TaskPriority[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly leaderboard = signal<LeaderboardEntry[]>([]);
  protected readonly seasonHint = (() => {
    const now = new Date();
    const daysIn = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = totalDays - daysIn;
    const fmt = (days: number) =>
      days === 1
        ? this.translate.instant('generic.widgets.season.dayOne')
        : this.translate.instant('generic.widgets.season.days', { days });
    return `${fmt(daysIn)} · ${fmt(daysLeft)}`;
  })();

  protected readonly form = new FormGroup({
    search: new FormControl(''),
    statusIds: new FormControl<TaskStatus[]>([]),
    priorityIds: new FormControl<TaskPriority[]>([]),
    projectIds: new FormControl<Project[]>([]),
    segmented: new FormControl<Segment>(''),
    sortOrder: new FormControl<SortOrder>('desc'),
    dateRange: new FormControl<TuiDayRange | null>(null),
  });

  protected readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)));

  protected readonly statusLabel = computed(() => {
    const ids = this.formValue()?.statusIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.status');
    if (ids.length === 1) return ids[0].name;
    return `this.translate.instant('generic.titles.status') (${ids.length})`;
  });

  protected readonly priorityLabel = computed(() => {
    const ids = this.formValue()?.priorityIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.priority');
    if (ids.length === 1) return ids[0].name;
    return `this.translate.instant('generic.titles.priority') (${ids.length})`;
  });

  protected readonly projectLabel = computed(() => {
    const ids = this.formValue()?.projectIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.project');
    if (ids.length === 1) return ids[0].projectName;
    return `this.translate.instant('generic.titles.project') (${ids.length})`;
  });

  protected readonly calendarOpen = signal(false);

  protected readonly sortIcon = computed(() =>
    this.formValue()?.sortOrder === 'asc'
      ? '@tui.arrow-up-narrow-wide'
      : '@tui.arrow-down-wide-narrow',
  );

  protected readonly dateLabel = computed(() => {
    const range = this.formValue()?.dateRange;
    if (!range) return this.translate.instant('generic.titles.dateRange');
    return `${this.fmtDay(range.from)} – ${this.fmtDay(range.to)}`;
  });

  protected readonly filterCount = computed(() => {
    const v = this.formValue();
    if (!v) return 0;
    return [
      !!v.search?.trim(),
      !!v.statusIds?.length,
      !!v.priorityIds?.length,
      !!v.projectIds?.length,
      !!v.segmented,
      v.sortOrder !== 'desc',
      !!v.dateRange,
    ].filter(Boolean).length;
  });

  protected readonly filteredFeed = computed(() => {
    const v = this.formValue();
    let tasks = this.allTasks();

    if (v?.segmented === 'Open') {
      tasks = tasks.filter((t) => this.isTaskOpen(t));
    } else if (v?.segmented === 'Closed') {
      tasks = tasks.filter((t) => !this.isTaskOpen(t));
    }

    return tasks;
  });

  protected readonly totalPages = computed(() => Math.ceil(this.filteredFeed().length / PAGE_SIZE));

  protected readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  protected readonly pagedFeed = computed(() => {
    const page = this.currentPage();
    return this.filteredFeed().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  });

  ngOnInit(): void {
    forkJoin([
      this.statusesService.getAll(),
      this.prioritiesService.getAll(),
      this.projectsService.getAll(),
    ]).subscribe(([statuses, priorities, projects]) => {
      this.statuses.set(statuses);
      this.priorities.set(priorities);
      this.projects.set(projects);
    });

    this.worklogService.getLeaderboard().subscribe((entries) => this.leaderboard.set(entries));

    this.form.valueChanges.pipe(startWith(this.form.value), debounceTime(300)).subscribe(() => {
      this.currentPage.set(0);
      this.fetchTasks();
    });
  }

  protected toggleSort(): void {
    const current = this.form.controls.sortOrder.value;
    this.form.controls.sortOrder.setValue(current === 'desc' ? 'asc' : 'desc');
  }

  protected openCreateDialog(): void {
    this.dialogService
      .component<TaskDialogComponent, boolean>(TaskDialogComponent, {
        label: this.translate.instant('generic.actions.create', {
          value: this.translate.instant('models.task.title.accusative'),
        }),
        size: 'fullscreen',
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.fetchTasks());
  }

  protected fetchTasks(): void {
    const { search, statusIds, priorityIds, projectIds, sortOrder, dateRange } = this.form.value;

    let params = new HttpParams();

    if (search?.trim()) {
      const trimmed = search.trim();
      if (trimmed.startsWith('#')) {
        const id = parseInt(trimmed.slice(1), 10);
        if (!isNaN(id)) params = params.set('identifier', id);
      } else {
        params = params.set('searchBy', 'title').set('searchValue', trimmed);
      }
    }
    if (statusIds?.length) {
      params = params.set('statusId', statusIds.map((s) => s.id).join(','));
    }
    if (priorityIds?.length) {
      params = params.set('priorityId', priorityIds.map((p) => p.id).join(','));
    }
    if (projectIds?.length) {
      params = params.set('projectId', projectIds.map((p) => p.id).join(','));
    }
    if (sortOrder) {
      params = params.set('orderBy', 'updatedAt').set('order', sortOrder);
    }
    if (dateRange) {
      params = params.set('from', dateRange.from.toLocalNativeDate().toISOString());
      params = params.set('to', dateRange.to.toLocalNativeDate().toISOString());
    }

    this.isLoading.set(true);
    this.taskService.getAll(params).subscribe({
      next: (tasks) => {
        this.allTasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected resetFilters(): void {
    this.form.reset({
      search: '',
      statusIds: [],
      priorityIds: [],
      projectIds: [],
      segmented: '',
      sortOrder: 'desc',
      dateRange: null,
    });
  }

  protected onDateRangeChange(range: TuiDayRange): void {
    this.form.controls.dateRange.setValue(range);
    this.calendarOpen.set(false);
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  private fmtDay(day: TuiDay): string {
    const months: string[] = this.translate.instant('generic.months');
    return `${months[day.month]} ${day.day}`;
  }

  private isTaskOpen(task: Task): boolean {
    return !task.closedAt || task.closedAt.startsWith('0001-01-01');
  }
}
