import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import {
  TuiDialogContext,
  TuiButton,
  TuiIcon,
  TuiTextfield,
  TuiCalendar,
  TuiLoader,
  TuiDropdown,
} from '@taiga-ui/core';
import { TuiInputDate, TuiInputTime, tuiInputTimeOptionsProvider } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TaskSuggestion } from '../../../task/types/task.model';
import { TaskSuggestionsComponent } from '../../../task/components/task-suggestions/task-suggestions.component';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { WorklogService } from '../../service/worklog.service';
import { WorklogDialogData } from '../../types/worklog.model';
import { WorklogStore } from '../../store/worklog.store';
import { UserStore } from '../../../user/store/user.store';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'app-worklog-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    TuiButton,
    TuiCalendar,
    TuiDropdown,
    TuiIcon,
    TuiInputDate,
    TuiInputTime,
    TuiLoader,
    TuiTextfield,
    TaskSuggestionsComponent,
  ],
  templateUrl: './worklog-dialog.html',
  styleUrl: './worklog-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [tuiInputTimeOptionsProvider({ icon: () => '' })],
})
export class WorklogDialogComponent implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  private readonly worklogService = inject(WorklogService);
  private readonly worklogStore = inject(WorklogStore);
  private readonly userStore = inject(UserStore);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  protected readonly context = injectContext<TuiDialogContext<boolean, WorklogDialogData>>();

  protected readonly searchText = signal<string>('');
  protected readonly taskSuggestions = signal<TaskSuggestion[]>([]);
  protected readonly isLoadingSuggestions = signal(false);
  protected readonly resolvedTask = signal<TaskSuggestion | null>(null);
  protected readonly isSubmitting = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchText$ = toObservable(this.searchText);

  protected readonly isEditMode = computed(() => !!this.context.data?.logId);

  protected readonly prefilledTask = computed(() => {
    if (this.isEditMode()) return null;
    const d = this.context.data;
    if (!d?.taskId) return null;
    return { id: d.taskId, identifier: d.taskIdentifier, title: d.taskTitle };
  });

  protected readonly shouldShowSuggestions = computed(() => {
    return !this.resolvedTask() && this.taskSuggestions().length > 0;
  });

  protected readonly form = new FormGroup({
    date: new FormControl<TuiDay | null>(null, [Validators.required]),
    startTime: new FormControl<TuiTime | null>(null, [Validators.required]),
    endTime: new FormControl<TuiTime | null>(null, [Validators.required]),
    description: new FormControl<string>(''),
  });

  ngOnInit(): void {
    const d = this.context.data;

    if (this.isEditMode()) {
      const startAt = new Date(d!.startAt!);
      const endAt = new Date(d!.endAt!);
      this.form.controls.date.setValue(TuiDay.fromLocalNativeDate(startAt));
      this.form.controls.startTime.setValue(TuiTime.fromLocalNativeDate(startAt));
      this.form.controls.endTime.setValue(TuiTime.fromLocalNativeDate(endAt));
      this.form.controls.description.setValue(d!.description ?? '');
      if (d!.taskId && d!.taskIdentifier) {
        this.resolvedTask.set({
          id: d!.taskId,
          identifier: d!.taskIdentifier,
          title: d!.taskTitle ?? '',
        });
        this.searchText.set(`#${d!.taskIdentifier}`);
      }
    } else {
      this.form.controls.date.setValue(TuiDay.fromLocalNativeDate(new Date()));
      this.prefillStartTimeFromTodaysLogs();
    }

    if (this.prefilledTask()) {
      return;
    }

    this.searchText$
      .pipe(
        debounceTime(250),
        map((value) => value.replace('#', '').trim()),
        distinctUntilChanged(),
        tap((query) => {
          if (!query) {
            this.taskSuggestions.set([]);
            this.isLoadingSuggestions.set(false);
          }
        }),
        filter((query) => query.length > 0),
        tap(() => this.isLoadingSuggestions.set(true)),
        switchMap((query) =>
          this.taskService.searchSuggestions(query, 8).pipe(
            catchError(() => of([])),
            finalize(() => this.isLoadingSuggestions.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tasks) => {
        if (!this.resolvedTask()) {
          this.taskSuggestions.set(tasks);
        }
      });
  }

  protected selectSuggestion(task: TaskSuggestion): void {
    this.resolvedTask.set(task);
    this.searchText.set(`#${task.identifier}`);
    this.taskSuggestions.set([]);
  }

  protected onSearchTextChange(value: string): void {
    this.searchText.set(value);

    const current = this.resolvedTask();
    if (current && value !== `#${current.identifier}`) {
      this.resolvedTask.set(null);
    }
  }

  protected setEndTimeNow(): void {
    this.form.controls.endTime.setValue(TuiTime.currentLocal());
  }

  private prefillStartTimeFromTodaysLogs(): void {
    const todayStr = new Date().toDateString();
    const todaysLogs = this.worklogStore
      .logs()
      .filter((l) => new Date(l.endAt).toDateString() === todayStr);

    if (!todaysLogs.length) return;

    const latest = todaysLogs.reduce((a, b) => (new Date(a.endAt) > new Date(b.endAt) ? a : b));
    this.form.controls.startTime.setValue(TuiTime.fromLocalNativeDate(new Date(latest.endAt)));
  }

  protected clearTask(): void {
    this.resolvedTask.set(null);
    this.searchText.set('');
  }

  protected navigateToTask(taskId: string): void {
    this.context.completeWith(false);
    this.router.navigate(['/tasks', taskId]);
  }

  protected cancel(): void {
    this.context.completeWith(false);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) return;

    const v = this.form.getRawValue();
    const date = v.date!.toLocalNativeDate();

    const startAt = new Date(date);
    startAt.setHours(v.startTime?.hours ?? 0, v.startTime?.minutes ?? 0, 0, 0);
    const endAt = new Date(date);
    endAt.setHours(v.endTime?.hours ?? 0, v.endTime?.minutes ?? 0, 0, 0);

    const taskId = this.prefilledTask()?.id ?? this.resolvedTask()?.id ?? '';
    const payload = {
      userId: this.userStore.user()!.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      taskId,
      description: v.description ?? '',
    };

    this.isSubmitting.set(true);

    const request$: Observable<unknown> = this.isEditMode()
      ? this.worklogService.update(this.context.data!.logId!, payload)
      : this.worklogService.add(payload);

    const successKey = this.isEditMode()
      ? 'cmd.worklog.success.updated'
      : 'cmd.worklog.success.created';
    const errorKey = this.isEditMode()
      ? 'cmd.worklog.errors.updateFailed'
      : 'cmd.worklog.errors.createFailed';

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.alert.success(this.translate.instant(successKey));
        this.context.completeWith(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.alert.error(this.translate.instant(errorKey));
      },
    });
  }
}
