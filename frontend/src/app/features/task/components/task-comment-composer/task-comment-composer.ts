import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiDataList, TuiDropdown, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TaskCoreService } from '../../service/task-core.service';
import { TaskDetailed, UpdateTaskInput } from '../../types/task.model';
import { TaskStatus, TaskStatusesService } from '../../service/task-statuses.service';
import { TaskPriority, TaskPrioritiesService } from '../../service/task-priorities.service';
import { TaskCategory } from '../../service/task-categories.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { User } from '../../../user/types/model/user.model';
import { Release } from '../../../project/service/release.service';
import { AppEditorComponent } from '../../../../common/editor/app-editor.component';

@Component({
  selector: 'app-task-comment-composer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiChevron,
    TuiSelect,
    TuiDataList,
    TuiDataListWrapper,
    TuiDropdown,
    AppEditorComponent,
  ],
  templateUrl: './task-comment-composer.html',
  styleUrl: './task-comment-composer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCommentComposerComponent implements OnChanges {
  @Input({ required: true }) taskId!: string;
  @Input({ required: true }) task!: TaskDetailed | null;
  @Input() statuses: TaskStatus[] = [];
  @Input() categories: TaskCategory[] = [];
  @Input() priorities: TaskPriority[] = [];
  @Input() releases: Release[] = [];
  @Input() users: User[] = [];
  @Output() submitted = new EventEmitter<void>();

  private readonly taskService = inject(TaskCoreService);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);

  protected readonly isExpanded = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly statusControl = new FormControl<TaskStatus | null>(null);
  protected readonly assigneeControl = new FormControl<User | null>(null);
  protected readonly categoryControl = new FormControl<TaskCategory | null>(null);
  protected readonly priorityControl = new FormControl<TaskPriority | null>(null);
  protected readonly bodyControl = new FormControl('', { nonNullable: true });

  protected readonly stringifyStatus = (s: TaskStatus): string => s.name;
  protected readonly stringifyUser = (u: User): string => `${u.name} ${u.surname}`;
  protected readonly stringifyCategory = (c: TaskCategory): string => c.name;
  protected readonly stringifyPriority = (p: TaskPriority): string => p.name;

  ngOnChanges(): void {
    if (this.isExpanded() && this.task) {
      this.syncControls();
    }
  }

  protected expand(): void {
    if (!this.task) return;
    this.syncControls();
    this.isExpanded.set(true);
  }

  private syncControls(): void {
    const t = this.task!;
    this.statusControl.setValue(this.statuses.find((s) => s.name === t.status) ?? null);
    this.assigneeControl.setValue(this.users.find((u) => u.id === t.assigneeId) ?? null);
    this.categoryControl.setValue(this.categories.find((c) => c.id === t.categoryId) ?? null);
    this.priorityControl.setValue(this.priorities.find((p) => p.name === t.priority) ?? null);
  }

  protected cancel(): void {
    this.isExpanded.set(false);
    this.bodyControl.reset();
  }

  protected submit(): void {
    if (this.isSubmitting() || !this.task) return;

    const body = this.bodyControl.value.trim();
    const status = this.statusControl.value;
    const assignee = this.assigneeControl.value;
    const category = this.categoryControl.value;
    const priority = this.priorityControl.value;
    const t = this.task;

    const input: UpdateTaskInput = {
      title: t.title,
      description: t.description,
      assigneeId: assignee?.id ?? t.assigneeId,
      statusId: status?.id,
      categoryId: category?.id ?? t.categoryId,
      priorityId: priority?.id,
      releaseId: t.releaseId,
      commentBody: body || undefined,
      assigneeName: assignee
        ? `${assignee.name} ${assignee.surname}`
        : `${t.assigneeName} ${t.assigneeSurname}`,
      statusName: status?.name ?? t.status,
      categoryName: category?.name ?? t.category,
      priorityName: priority?.name ?? t.priority,
      releaseName: t.projectRelease,
    };

    this.isSubmitting.set(true);
    this.taskService.update(this.taskId, input).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isExpanded.set(false);
        this.bodyControl.reset();
        this.submitted.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.alert.error(this.translate.instant('cmd.tasks.errors.updateFailed'));
      },
    });
  }
}
