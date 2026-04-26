import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { debounceTime, map, startWith } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { USERTASKSIMPORTS } from './user-tasks.imports';
import { Task } from '../../../task/types/task.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { UserStore } from '../../store/user.store';

type TabMode = 'assigned' | 'created' | 'history';
type SortOrder = 'asc' | 'desc';

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
  private readonly translate = inject(TranslateService);
  private readonly userStore = inject(UserStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly activeTab = toSignal(
    this.route.url.pipe(map((segments) => (segments[0]?.path as TabMode) ?? 'assigned')),
    { initialValue: 'assigned' as TabMode },
  );
  protected readonly currentPage = signal(0);
  protected readonly allTasks = signal<Task[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly form = new FormGroup({
    search: new FormControl(''),
    sortOrder: new FormControl<SortOrder>('desc'),
    dateRange: new FormControl<TuiDayRange | null>(null),
  });

  protected readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)));

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
    return [!!v.search?.trim(), v.sortOrder !== 'desc', !!v.dateRange].filter(Boolean).length;
  });

  protected readonly totalPages = computed(() => Math.ceil(this.allTasks().length / PAGE_SIZE));
  protected readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  protected readonly pagedTasks = computed(() => {
    const page = this.currentPage();
    return this.allTasks().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  });

  ngOnInit(): void {
    this.route.url.subscribe(() => {
      this.currentPage.set(0);
      this.fetchTasks();
    });

    this.form.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(0);
      this.fetchTasks();
    });
  }

  protected toggleSort(): void {
    const current = this.form.controls.sortOrder.value;
    this.form.controls.sortOrder.setValue(current === 'desc' ? 'asc' : 'desc');
  }

  protected fetchTasks(): void {
    const userId = this.userStore.user()?.id;
    if (!userId) return;

    const { search, sortOrder, dateRange } = this.form.value;

    let params = new HttpParams();

    if (this.activeTab() === 'assigned') {
      params = params.set('assigneeId', userId);
    } else if (this.activeTab() === 'created') {
      params = params.set('authorId', userId);
    }

    if (search?.trim()) {
      params = params.set('searchBy', 'title').set('searchValue', search.trim());
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
}
