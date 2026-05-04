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
import { TuiDay } from '@taiga-ui/cdk';
import {
  TuiDialogContext,
  TuiButton,
  TuiIcon,
  TuiTextfield,
  TuiCalendar,
  TuiLoader,
  TuiDropdown,
} from '@taiga-ui/core';
import { TuiInputDate } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Task, TaskSuggestion } from '../../../task/types/task.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { WorklogService } from '../../service/worklog.service';
import { WorklogDialogData } from '../../types/worklog.model';
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
    TuiLoader,
    TuiTextfield,
  ],
  templateUrl: './worklog-dialog.html',
  styleUrl: './worklog-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorklogDialogComponent implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  private readonly worklogService = inject(WorklogService);
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

  protected readonly prefilledTask = computed(() => {
    const d = this.context.data;
    if (!d?.taskId) return null;
    return { id: d.taskId, identifier: d.taskIdentifier, title: d.taskTitle };
  });

  protected readonly shouldShowSuggestions = computed(() => {
    return !this.resolvedTask() && this.taskSuggestions().length > 0;
  });

  protected readonly form = new FormGroup({
    date: new FormControl<TuiDay | null>(null, [Validators.required]),
    startTime: new FormControl<string>('', [Validators.required]),
    endTime: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string>(''),
  });

  ngOnInit(): void {
    this.form.controls.date.setValue(TuiDay.fromLocalNativeDate(new Date()));

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

    const userId = this.userStore.user()?.id;
    if (!userId) return;

    const v = this.form.getRawValue();
    const date = v.date!.toLocalNativeDate();

    const [sh, sm] = (v.startTime || '00:00').split(':').map(Number);
    const [eh, em] = (v.endTime || '00:00').split(':').map(Number);

    const startAt = new Date(date);
    startAt.setHours(sh, sm, 0, 0);
    const endAt = new Date(date);
    endAt.setHours(eh, em, 0, 0);

    const taskId = this.prefilledTask()?.id ?? this.resolvedTask()?.id ?? '';

    this.isSubmitting.set(true);
    this.worklogService
      .add(userId, {
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        taskId,
        description: v.description ?? '',
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.alert.success(this.translate.instant('cmd.worklog.success.created'));
          this.context.completeWith(true);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.alert.error(this.translate.instant('cmd.worklog.errors.createFailed'));
        },
      });
  }
}
