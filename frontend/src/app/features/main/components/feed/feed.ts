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
import { debounceTime, distinctUntilChanged, filter, forkJoin, startWith } from 'rxjs';
import { FEEDIMPORTS } from './feed.imports';
import { DeadlinePressure, DeadlineTask, StatusDistributionItem, StatusTasksPage, Task, VelocityData } from '../../../task/types/task.model';
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
import { PostService } from '../../../post/service/post.service';
import {
  PostDialogComponent,
  PostDialogData,
} from '../../../post/components/dialog/post-dialog.component';
import {
  CreatePostDialogComponent,
  CreatePostDialogData,
} from '../../../post/components/create-post-dialog/create-post-dialog.component';
import { Post, PostPriority, PostQuery, PostType } from '../../../post/types/post.model';
import { UserStore } from '../../../user/store/user.store';

type FeedMode = 'all' | 'tasks' | 'posts';
type Segment = '' | 'open' | 'closed';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 8;

type MetricSlide = {
  title: string;
  icon: string;
  description: string;
};

export type FeedItem =
  | { kind: 'task'; id: string; createdAt: string; task: Task }
  | { kind: 'post'; id: string; createdAt: string; post: Post };

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
  private readonly postService = inject(PostService);
  private readonly userStore = inject(UserStore);

  protected readonly NaN = NaN;
  protected readonly feedMode = signal<FeedMode>('all');
  protected readonly metricsCarouselIndex = signal(0);
  protected readonly deadlinePressure = signal<DeadlinePressure | null>(null);
  protected readonly statusDistribution = signal<StatusDistributionItem[]>([]);
  protected readonly statusChartActiveIndex = signal(NaN);
  protected readonly selectedStatusForDropdown = signal(NaN);
  protected readonly statusDropdownPage = signal(0);
  protected readonly statusDropdownData = signal<StatusTasksPage | null>(null);
  protected readonly currentPage = signal(0);

  protected readonly metricSlides = [
    { title: 'Deadline Pressure', icon: '@tui.clock-alert' },
    { title: 'Task Health', icon: '@tui.chart-pie' },
    { title: 'Momentum Score', icon: '@tui.zap' },
  ] as const;

  protected readonly isLoading = signal(false);
  protected readonly calendarOpen = signal(false);
  protected readonly createMenuOpen = signal(false);

  protected readonly tasks = signal<Task[]>([]);
  protected readonly posts = signal<Post[]>([]);
  protected readonly allFeedItems = signal<FeedItem[]>([]);

  protected readonly statuses = signal<TaskStatus[]>([]);
  protected readonly priorities = signal<TaskPriority[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly leaderboard = signal<LeaderboardEntry[]>([]);

  protected readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    statusIds: new FormControl<TaskStatus[]>([], { nonNullable: true }),
    priorityIds: new FormControl<TaskPriority[]>([], { nonNullable: true }),
    projectIds: new FormControl<Project[]>([], { nonNullable: true }),
    segmented: new FormControl<Segment>('', { nonNullable: true }),
    sortOrder: new FormControl<SortOrder>('desc', { nonNullable: true }),
    dateRange: new FormControl<TuiDayRange | null>(null),
  });

  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly currentItems = computed((): FeedItem[] => {
    const mode = this.feedMode();

    if (mode === 'tasks') {
      return this.filteredTasks().map((task) => this.toTaskFeedItem(task));
    }

    if (mode === 'posts') {
      return this.posts().map((post) => this.toPostFeedItem(post));
    }

    return this.allFeedItems();
  });

  protected readonly filteredTasks = computed(() => {
    const segment = this.formValue().segmented;
    const tasks = this.tasks();

    if (segment === 'open') {
      return tasks.filter((task) => this.isTaskOpen(task));
    }

    if (segment === 'closed') {
      return tasks.filter((task) => !this.isTaskOpen(task));
    }

    return tasks;
  });

  protected readonly totalPages = computed(() => Math.ceil(this.currentItems().length / PAGE_SIZE));

  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index),
  );

  protected readonly pagedItems = computed(() => {
    const page = this.currentPage();

    return this.currentItems().slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  });

  protected readonly sortIcon = computed(() =>
    this.formValue().sortOrder === 'asc'
      ? '@tui.arrow-up-narrow-wide'
      : '@tui.arrow-down-wide-narrow',
  );

  protected readonly searchPlaceholder = computed(() => {
    const mode = this.feedMode();

    const value =
      mode === 'posts'
        ? this.translate.instant('feed.posts.titlePlural').toLowerCase()
        : mode === 'tasks'
          ? this.translate.instant('models.task.title.plural').toLowerCase()
          : this.translate.instant('feed.items').toLowerCase();

    return this.translate.instant('generic.actions.search', { value });
  });

  protected readonly createHint = computed(() => {
    const value =
      this.feedMode() === 'posts'
        ? this.translate.instant('feed.posts.accusative')
        : this.translate.instant('models.task.title.accusative');

    return this.translate.instant('generic.actions.create', {
      value: value.toLowerCase(),
    });
  });

  protected readonly statusLabel = computed(() => {
    const selected = this.formValue().statusIds;

    if (!selected?.length) {
      return this.translate.instant('generic.titles.status');
    }

    if (selected.length === 1) {
      return selected[0].name;
    }

    return `${this.translate.instant('generic.titles.status')} (${selected.length})`;
  });

  protected readonly priorityLabel = computed(() => {
    const selected = this.formValue().priorityIds;

    if (!selected?.length) {
      return this.translate.instant('generic.titles.priority');
    }

    if (selected.length === 1) {
      return selected[0].name;
    }

    return `${this.translate.instant('generic.titles.priority')} (${selected.length})`;
  });

  protected readonly projectLabel = computed(() => {
    const selected = this.formValue().projectIds;

    if (!selected?.length) {
      return this.translate.instant('generic.titles.project');
    }

    if (selected.length === 1) {
      return selected[0].projectName;
    }

    return `${this.translate.instant('generic.titles.project')} (${selected.length})`;
  });

  protected readonly segmentLabel = computed(() => {
    const segment = this.formValue().segmented;

    if (segment === 'open') {
      return this.translate.instant('feed.segments.open');
    }

    if (segment === 'closed') {
      return this.translate.instant('feed.segments.closed');
    }

    return this.translate.instant('feed.segments.all');
  });

  protected readonly dateLabel = computed(() => {
    const range = this.formValue().dateRange;

    if (!range) {
      return this.translate.instant('generic.titles.dateRange');
    }

    return `${this.fmtDay(range.from)} – ${this.fmtDay(range.to)}`;
  });

  protected readonly filterCount = computed(() => {
    const value = this.formValue();

    const commonCount = [
      !!value.search?.trim(),
      value.sortOrder !== 'desc',
      !!value.dateRange,
    ].filter(Boolean).length;

    if (this.feedMode() !== 'tasks') {
      return commonCount;
    }

    return (
      commonCount +
      [
        !!value.statusIds?.length,
        !!value.priorityIds?.length,
        !!value.projectIds?.length,
        !!value.segmented,
      ].filter(Boolean).length
    );
  });

  protected readonly seasonHint = computed(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - currentDay;

    return this.translate.instant('generic.widgets.season.progress', {
      current: currentDay,
      left: daysLeft,
    });
  });

  protected readonly statusChartValues = computed((): ReadonlyArray<number> =>
    this.statusDistribution().map((i) => i.count),
  );

  protected readonly statusChartActiveLabel = computed((): string => {
    const i = this.statusChartActiveIndex();
    if (isNaN(i)) return this.translate.instant('generic.widgets.taskHealth.totalLabel');
    return this.statusDistribution()[i]?.status ?? '';
  });

  protected readonly statusChartActiveCount = computed((): number => {
    const i = this.statusChartActiveIndex();
    const items = this.statusDistribution();
    if (isNaN(i)) return items.reduce((sum, x) => sum + x.count, 0);
    return items[i]?.count ?? 0;
  });

  protected readonly statusDropdownTotalPages = computed(() => {
    const data = this.statusDropdownData();
    return data ? Math.ceil(data.total / 5) : 0;
  });

  protected readonly velocity = signal<VelocityData | null>(null);

  protected readonly activityChartValue = computed((): ReadonlyArray<readonly number[]> => {
    const v = this.velocity();
    if (!v) return [];
    return [
      v.lastWeek.map((d) => d.count),
      v.thisWeek.map((d) => d.count),
    ];
  });

  protected readonly activityChartMax = computed((): number => {
    const v = this.velocity();
    if (!v) return 1;
    const maxColumnSum = Math.max(...v.lastWeek.map((d, i) => d.count + v.thisWeek[i].count));
    return Math.max(1, maxColumnSum);
  });

  protected readonly activityLabelsX = computed((): string[] => {
    const v = this.velocity();
    if (!v) return [];
    return v.thisWeek.map((d) => this.velocityDayLabel(d.day));
  });

  protected readonly velocityTrendPositive = computed(() => {
    const v = this.velocity();
    return v ? v.changePercent >= 0 : true;
  });

  ngOnInit(): void {
    forkJoin([
      this.statusesService.getAll(),
      this.prioritiesService.getAll(),
      this.projectsService.getAll(),
      this.worklogService.getLeaderboard(),
    ]).subscribe(([statuses, priorities, projects, leaderboard]) => {
      this.statuses.set(statuses);
      this.priorities.set(priorities);
      this.projects.set(projects);
      this.leaderboard.set(leaderboard);
    });

    this.taskService.getDeadlinePressure().subscribe((data) => {
      this.deadlinePressure.set(data);
    });

    this.taskService.getStatusDistribution().subscribe((data) => {
      this.statusDistribution.set(data);
    });

    this.taskService.getVelocity().subscribe((data) => {
      this.velocity.set(data);
    });

    this.form.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe(() => {
        this.currentPage.set(0);
        this.fetchCurrentMode();
      });

    this.fetchAll();
  }

  protected setFeedMode(mode: FeedMode): void {
    if (this.feedMode() === mode) {
      return;
    }

    this.feedMode.set(mode);
    this.currentPage.set(0);

    if (mode !== 'tasks') {
      this.form.patchValue(
        {
          statusIds: [],
          priorityIds: [],
          projectIds: [],
          segmented: '',
        },
        { emitEvent: false },
      );
    }

    this.fetchCurrentMode();
  }

  protected fetchCurrentMode(): void {
    switch (this.feedMode()) {
      case 'tasks':
        this.fetchTasks();
        return;

      case 'posts':
        this.fetchPosts();
        return;

      case 'all':
        this.fetchAll();
        return;
    }
  }

  protected fetchTasks(): void {
    this.isLoading.set(true);

    this.taskService.getAll(this.buildTaskParams()).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.tasks.set([]);
        this.isLoading.set(false);
      },
    });
  }

  protected fetchPosts(): void {
    this.isLoading.set(true);

    this.postService.getAll(this.buildPostQuery()).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.isLoading.set(false);
      },
      error: () => {
        this.posts.set([]);
        this.isLoading.set(false);
      },
    });
  }

  protected fetchAll(): void {
    this.isLoading.set(true);

    forkJoin([
      this.taskService.getAll(this.buildTaskParams(false)),
      this.postService.getAll(this.buildPostQuery()),
    ]).subscribe({
      next: ([tasks, posts]) => {
        const items: FeedItem[] = [
          ...tasks.map((task) => this.toTaskFeedItem(task)),
          ...posts.map((post) => this.toPostFeedItem(post)),
        ];

        this.allFeedItems.set(this.sortItems(items));
        this.tasks.set(tasks);
        this.posts.set(posts);
        this.isLoading.set(false);
      },
      error: () => {
        this.allFeedItems.set([]);
        this.isLoading.set(false);
      },
    });
  }

  protected toggleSort(): void {
    const current = this.form.controls.sortOrder.value;
    this.form.controls.sortOrder.setValue(current === 'desc' ? 'asc' : 'desc');
  }

  protected resetFilters(): void {
    if (this.feedMode() === 'tasks') {
      this.form.reset({
        search: '',
        statusIds: [],
        priorityIds: [],
        projectIds: [],
        segmented: '',
        sortOrder: 'desc',
        dateRange: null,
      });

      return;
    }

    this.form.patchValue({
      search: '',
      sortOrder: 'desc',
      dateRange: null,
    });
  }

  protected onDateRangeChange(range: TuiDayRange): void {
    this.form.controls.dateRange.setValue(range);
    this.calendarOpen.set(false);
  }

  protected setPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  protected trackFeedItem(item: FeedItem): string {
    return `${item.kind}:${item.id}`;
  }

  protected openCreateDialog(): void {
    if (this.feedMode() === 'posts') {
      this.openCreatePostDialog();
      return;
    }

    this.openCreateTaskDialog();
  }

  protected openCreateTaskDialog(): void {
    this.createMenuOpen.set(false);
    this.dialogService
      .component<TaskDialogComponent, boolean>(TaskDialogComponent, {
        label: this.translate.instant('generic.actions.create', {
          value: this.translate.instant('models.task.title.accusative'),
        }),
        size: 'fullscreen',
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.fetchCurrentMode());
  }

  protected openCreatePostDialog(): void {
    this.createMenuOpen.set(false);
    this.dialogService
      .component<CreatePostDialogComponent, boolean, CreatePostDialogData>(
        CreatePostDialogComponent,
        {
          label: this.translate.instant('feed.posts.create'),
          size: 'l',
          data: {},
        },
      )
      .pipe(filter(Boolean))
      .subscribe(() => this.fetchCurrentMode());
  }

  protected openPostDialog(post: Post): void {
    this.dialogService
      .component<PostDialogComponent, boolean, PostDialogData>(PostDialogComponent, {
        label: post.title,
        size: 'l',
        data: { post },
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.fetchCurrentMode());
  }

  protected postTypeLabel(type: PostType): string {
    return `feed.posts.types.${type}`;
  }

  protected postPriorityLabel(priority: PostPriority): string {
    return `feed.posts.priorities.${priority}`;
  }

  protected postPriorityAppearance(priority: PostPriority): string {
    switch (priority) {
      case 'critical':
        return 'negative';

      case 'high':
        return 'warning';

      case 'low':
        return 'neutral';

      default:
        return 'primary';
    }
  }

  protected deadlineRelativeDate(task: DeadlineTask): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueAt);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    const t = (key: string, params?: object) =>
      this.translate.instant(`generic.widgets.deadlinePressure.${key}`, params);

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('tomorrow');
    if (diffDays === -1) return t('yesterday');
    if (diffDays < 0) return t('daysOverdue', { count: Math.abs(diffDays) });
    return t('inDays', { count: diffDays });
  }

  protected onStatusDropdownChange(open: boolean, index: number): void {
    if (open) {
      this.selectedStatusForDropdown.set(index);
      this.statusChartActiveIndex.set(index);
      this.statusDropdownPage.set(0);
      this.statusDropdownData.set(null);
      this.fetchStatusTasks(index, 0);
    } else if (this.selectedStatusForDropdown() === index) {
      this.selectedStatusForDropdown.set(NaN);
      this.statusChartActiveIndex.set(NaN);
    }
  }

  protected onStatusDropdownPageChange(page: number): void {
    this.statusDropdownPage.set(page);
    this.fetchStatusTasks(this.selectedStatusForDropdown(), page);
  }

  private fetchStatusTasks(legendIndex: number, page: number): void {
    const item = this.statusDistribution()[legendIndex];
    if (!item) return;
    const status = this.statuses().find((s) => s.name === item.status);
    if (!status) return;
    this.taskService.getStatusTasks(status.id, page).subscribe((data) => {
      this.statusDropdownData.set(data);
    });
  }

  private buildTaskParams(includeTaskFilters = true): HttpParams {
    const value = this.form.getRawValue();

    let params = new HttpParams();

    const search = value.search.trim();

    if (search) {
      if (search.startsWith('#')) {
        const identifier = Number.parseInt(search.slice(1), 10);

        if (!Number.isNaN(identifier)) {
          params = params.set('identifier', identifier);
        }
      } else {
        params = params.set('searchBy', 'title').set('searchValue', search);
      }
    }

    params = params.set('orderBy', 'createdAt').set('order', value.sortOrder);

    if (value.dateRange) {
      params = params
        .set('from', value.dateRange.from.toLocalNativeDate().toISOString())
        .set('to', value.dateRange.to.toLocalNativeDate().toISOString());
    }

    if (!includeTaskFilters) {
      return params;
    }

    if (value.statusIds.length) {
      params = params.set('statusId', value.statusIds.map((s) => s.id).join(','));
    }

    if (value.priorityIds.length) {
      params = params.set('priorityId', value.priorityIds.map((p) => p.id).join(','));
    }

    if (value.projectIds.length) {
      params = params.set('projectId', value.projectIds.map((p) => p.id).join(','));
    }

    return params;
  }

  private buildPostQuery(): PostQuery {
    const value = this.form.getRawValue();

    return {
      searchValue: value.search.trim(),
      sort: value.sortOrder,
      from: value.dateRange ? value.dateRange.from.toLocalNativeDate().toISOString() : undefined,
      to: value.dateRange ? value.dateRange.to.toLocalNativeDate().toISOString() : undefined,
      pageSize: 50,
    };
  }

  private toTaskFeedItem(task: Task): FeedItem {
    return {
      kind: 'task',
      id: task.id,
      createdAt: task.createdAt,
      task,
    };
  }

  private toPostFeedItem(post: Post): FeedItem {
    return {
      kind: 'post',
      id: post.id,
      createdAt: post.createdAt,
      post,
    };
  }

  private sortItems(items: FeedItem[]): FeedItem[] {
    const sortOrder = this.form.controls.sortOrder.value;

    return [...items].sort((a, b) => {
      const result = a.createdAt.localeCompare(b.createdAt);
      return sortOrder === 'asc' ? result : -result;
    });
  }

  protected velocityDayLabel(dateStr: string): string {
    const days = this.translate.instant('generic.daysShort') as string[];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
  }

  private fmtDay(day: TuiDay): string {
    const months = this.translate.instant('generic.months') as string[];
    return `${months[day.month]} ${day.day}`;
  }

  private isTaskOpen(task: Task): boolean {
    return !task.closedAt || task.closedAt.startsWith('0001-01-01');
  }
}
