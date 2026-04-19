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
import { debounceTime, forkJoin, startWith } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { USERTASKSIMPORTS } from './user-tasks.imports';
import { Task } from '../../../task/types/task.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { TaskStatus, TaskStatusesService } from '../../../task/service/task-statuses.service';
import { TaskPriority, TaskPrioritiesService } from '../../../task/service/task-priorities.service';
import { ProjectApiService } from '../../../project/service/project.service';
import { Project } from '../../../project/types/model/project.model';
import { UserStore } from '../../store/user.store';

type TabMode = 'assigned' | 'created';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-user-tasks',
  imports: [USERTASKSIMPORTS],
  templateUrl: './user-tasks.html',
  styleUrl: './user-tasks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [tuiScrollbarOptionsProvider({ mode: 'hover' })],
})
export class UserTasks implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  private readonly statusesService = inject(TaskStatusesService);
  private readonly prioritiesService = inject(TaskPrioritiesService);
  private readonly projectsService = inject(ProjectApiService);
  private readonly translate = inject(TranslateService);
  private readonly userStore = inject(UserStore);

  protected readonly activeTab = signal<TabMode>('assigned');
  protected readonly activeTabIndex = computed(() => this.activeTab() === 'assigned' ? 0 : 1);
  protected readonly currentPage = signal(0);
  protected readonly allTasks = signal<Task[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly statuses = signal<TaskStatus[]>([]);
  protected readonly priorities = signal<TaskPriority[]>([]);
  protected readonly projects = signal<Project[]>([]);

  protected readonly form = new FormGroup({
    search: new FormControl(''),
    statusIds: new FormControl<TaskStatus[]>([]),
    priorityIds: new FormControl<TaskPriority[]>([]),
    projectIds: new FormControl<Project[]>([]),
    dateRange: new FormControl<TuiDayRange | null>(null),
  });

  protected readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)));

  protected readonly statusLabel = computed(() => {
    const ids = this.formValue()?.statusIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.status');
    if (ids.length === 1) return ids[0].name;
    return `${this.translate.instant('generic.titles.status')} (${ids.length})`;
  });

  protected readonly priorityLabel = computed(() => {
    const ids = this.formValue()?.priorityIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.priority');
    if (ids.length === 1) return ids[0].name;
    return `${this.translate.instant('generic.titles.priority')} (${ids.length})`;
  });

  protected readonly projectLabel = computed(() => {
    const ids = this.formValue()?.projectIds ?? [];
    if (!ids.length) return this.translate.instant('generic.titles.project');
    if (ids.length === 1) return ids[0].projectName;
    return `${this.translate.instant('generic.titles.project')} (${ids.length})`;
  });

  protected readonly calendarOpen = signal(false);

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
      !!v.dateRange,
    ].filter(Boolean).length;
  });

  protected readonly totalPages = computed(() => Math.ceil(this.allTasks().length / PAGE_SIZE));
  protected readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  protected readonly pagedTasks = computed(() => {
    const page = this.currentPage();
    return this.allTasks().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
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

    this.form.valueChanges.pipe(startWith(this.form.value), debounceTime(300)).subscribe(() => {
      this.currentPage.set(0);
      this.fetchTasks();
    });
  }

  protected setTab(tab: TabMode): void {
    this.activeTab.set(tab);
    this.currentPage.set(0);
    this.fetchTasks();
  }

  protected fetchTasks(): void {
    const userId = this.userStore.user()?.id;
    if (!userId) return;

    const { search, statusIds, priorityIds, projectIds, dateRange } = this.form.value;

    let params = new HttpParams();

    if (this.activeTab() === 'assigned') {
      params = params.set('assigneeId', userId);
    } else {
      params = params.set('authorId', userId);
    }

    if (search?.trim()) {
      params = params.set('searchBy', 'title').set('searchValue', search.trim());
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
}
