import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, filter, of, switchMap } from 'rxjs';
import { TuiDay } from '@taiga-ui/cdk';
import { TuiEditorTool, provideTuiEditor } from '@taiga-ui/editor';
import { EDITOR_RU_PROVIDER } from '../../../../common/editor/editor-i18n';
import { TaskCoreService } from '../../service/task-core.service';
import { FileService } from '../../../../common/file/file.service';
import { TaskDetailed, UpdateTaskInput } from '../../types/task.model';
import { TaskStatus, TaskStatusesService } from '../../service/task-statuses.service';
import { TaskPriority, TaskPrioritiesService } from '../../service/task-priorities.service';
import { TaskCategory, TaskCategoriesService } from '../../service/task-categories.service';
import { Release, ReleaseService } from '../../../project/service/release.service';
import { DETAILED_IMPORTS } from './detailed.imports';
import { UserStore } from '../../../user/store/user.store';
import { UserApiService } from '../../../user/service/user.service';
import { User } from '../../../user/types/model/user.model';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { WorklogDialogComponent } from '../../../worklog/components/dialog/worklog-dialog.component';
import { WorklogDialogData } from '../../../worklog/types/worklog.model';

@Component({
  selector: 'app-detailed',
  imports: [...DETAILED_IMPORTS],
  templateUrl: './detailed.html',
  styleUrl: './detailed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideTuiEditor(), EDITOR_RU_PROVIDER],
})
export class Detailed implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  protected readonly fileService = inject(FileService);
  private readonly statusesService = inject(TaskStatusesService);
  private readonly prioritiesService = inject(TaskPrioritiesService);
  private readonly categoriesService = inject(TaskCategoriesService);
  private readonly releaseService = inject(ReleaseService);
  private readonly userApiService = inject(UserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);
  private readonly dialogs = inject(AppDialogService);

  protected readonly task = signal<TaskDetailed | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly infoExpanded = signal(false);

  protected readonly attachedFilesExpanded = signal(false);
  protected readonly deleteConfirmPending = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly statuses = signal<TaskStatus[]>([]);
  protected readonly priorities = signal<TaskPriority[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly categories = signal<TaskCategory[]>([]);
  protected readonly releases = signal<Release[]>([]);
  protected readonly removedFileIds = signal<string[]>([]);
  protected readonly isAddingParticipant = signal(false);
  protected readonly participantControl = new FormControl<User | null>(null);

  protected readonly availableParticipants = computed(() => {
    const task = this.task();
    if (!task) return this.users();
    const memberIds = new Set(task.members.map((m) => m.id));
    return this.users().filter((u) => !memberIds.has(u.id));
  });

  protected readonly visibleAttachedFiles = computed(() => {
    const task = this.task();
    if (!task) return [];
    const removed = this.removedFileIds();
    return task.attachedFiles.filter((f) => !removed.includes(f.id));
  });

  protected taskId = '';

  protected readonly descriptionTools = [
    TuiEditorTool.Bold,
    TuiEditorTool.Italic,
    TuiEditorTool.Underline,
    TuiEditorTool.List,
    TuiEditorTool.Link,
    TuiEditorTool.Code,
  ];

  protected get descriptionValue(): string {
    return this.form.controls.description.value;
  }

  protected toggleEditing(): void {
    if (this.isEditing()) {
      this.removedFileIds.set([]);
    }
    this.isEditing.update((v) => !v);
  }

  protected removeExistingFile(fileId: string): void {
    this.removedFileIds.update((ids) => [...ids, fileId]);
  }

  protected handleDescriptionClick(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    if (!link) return;

    const href = link.getAttribute('href') ?? '';
    const match = href.match(/\/api\/files\/([^/]+)\/([^/]+)\/([^/?\s]+)/);
    if (!match) return;

    event.preventDefault();
    const [, entityType, entityId, fileId] = match;
    this.fileService.download(entityType, entityId, {
      id: fileId,
      name: link.textContent?.trim() || fileId,
    });
  }

  protected readonly canDelete = computed(() => {
    const user = this.userStore.user();
    const task = this.task();
    if (!user || !task) return false;
    return this.userStore.isAtLeastAdmin() || task.authorId === user.id;
  });

  protected readonly canClose = computed(() => {
    const task = this.task();
    if (!task) return false;
    return !task.closedAt || task.closedAt.startsWith('0001');
  });

  protected readonly isClosed = computed(() => !this.canClose());

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<TaskStatus | null>(null),
    priority: new FormControl<TaskPriority | null>(null),
    assignee: new FormControl<User | null>(null),
    release: new FormControl<Release | null>(null),
    category: new FormControl<TaskCategory | null>(null),
    dueAt: new FormControl<TuiDay | null>(null),
  });

  protected readonly stringifyStatus = (s: TaskStatus): string => s.name;
  protected readonly stringifyPriority = (p: TaskPriority): string => p.name;
  protected readonly stringifyUser = (u: User): string => `${u.name} ${u.surname}`;
  protected readonly stringifyRelease = (r: Release): string => r.title;
  protected readonly stringifyCategory = (c: TaskCategory): string => c.name;

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id')!;

    forkJoin([
      this.taskService.getById(this.taskId),
      this.statusesService.getAll(),
      this.prioritiesService.getAll(),
      this.userApiService.getAll(),
    ]).subscribe({
      next: ([task, statuses, priorities, users]) => {
        this.task.set(task);
        this.statuses.set(statuses);
        this.priorities.set(priorities);
        this.users.set(users);
        this.isLoading.set(false);

        forkJoin([
          this.releaseService.getByProject(task.projectId),
          this.categoriesService.getAll(task.projectId),
        ]).subscribe(([releases, categories]) => {
          this.releases.set(releases);
          this.categories.set(categories);
          this.patchForm(task, statuses, priorities, users, releases, categories);
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  private patchForm(
    task: TaskDetailed,
    statuses: TaskStatus[],
    priorities: TaskPriority[],
    users: User[],
    releases: Release[],
    categories: TaskCategory[],
  ): void {
    const status = statuses.find((s) => s.name === task.status) ?? null;
    const priority = priorities.find((p) => p.name === task.priority) ?? null;
    const assignee = users.find((u) => u.id === task.assigneeId) ?? null;
    const release = releases.find((r) => r.id === task.releaseId) ?? null;
    const category = categories.find((c) => c.id === task.categoryId) ?? null;
    const dueAt =
      task.dueAt && !task.dueAt.startsWith('0001')
        ? TuiDay.fromLocalNativeDate(new Date(task.dueAt))
        : null;

    this.form.patchValue({
      title: task.title,
      description: task.description,
      status,
      priority,
      assignee,
      release,
      category,
      dueAt,
    });
  }

  protected save(): void {
    if (this.isSaving()) return;
    const v = this.form.getRawValue();
    const input: UpdateTaskInput = {
      title: v.title,
      description: v.description,
      statusId: v.status?.id,
      priorityId: v.priority?.id,
      assigneeId: v.assignee?.id,
      releaseId: v.release?.id,
      categoryId: v.category?.id,
      dueAt: v.dueAt ? v.dueAt.toLocalNativeDate().toISOString() : undefined,
    };

    this.isSaving.set(true);
    this.taskService
      .update(this.taskId, input)
      .pipe(
        switchMap(() => {
          const removals = this.removedFileIds().map((id) =>
            this.fileService.remove('tasks', this.taskId, id),
          );
          return removals.length ? forkJoin(removals) : of(null);
        }),
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.removedFileIds.set([]);
          this.alert.success(this.translate.instant('cmd.tasks.success.updated'));
          this.taskService.getById(this.taskId).subscribe((task) => this.task.set(task));
        },
        error: () => {
          this.isSaving.set(false);
          this.alert.error(this.translate.instant('cmd.tasks.errors.updateFailed'));
        },
      });
  }

  protected requestDelete(): void {
    this.deleteConfirmPending.set(true);
  }

  protected cancelDelete(): void {
    this.deleteConfirmPending.set(false);
  }

  protected confirmDelete(): void {
    if (this.isDeleting()) return;

    this.dialogs
      .confirm({
        label: this.translate.instant('cmd.tasks.dialogs.deleteTitle'),
        content: this.translate.instant('cmd.tasks.dialogs.deleteContent'),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.taskService.delete(this.taskId).subscribe({
          next: () => {
            this.alert.success(this.translate.instant('cmd.tasks.success.deleted'));
            this.router.navigate(['/main']);
          },
          error: () => {
            this.isDeleting.set(false);
            this.alert.error(this.translate.instant('cmd.tasks.errors.deleteFailed'));
          },
        });
      });
  }

  protected closeTask(): void {
    this.taskService.close(this.taskId).subscribe({
      next: () => {
        this.isEditing.set(false);
        this.alert.success(this.translate.instant('cmd.tasks.success.closed'));
        this.taskService.getById(this.taskId).subscribe((task) => this.task.set(task));
      },
      error: () => {
        this.alert.error(this.translate.instant('cmd.tasks.errors.closeFailed'));
      },
    });
  }

  protected reopenTask(): void {
    this.taskService.reopen(this.taskId).subscribe({
      next: () => {
        this.isEditing.set(false);
        this.alert.success(this.translate.instant('cmd.tasks.success.reopened'));
        this.taskService.getById(this.taskId).subscribe((task) => this.task.set(task));
      },
      error: () => {
        this.alert.error(this.translate.instant('cmd.tasks.errors.reopenFailed'));
      },
    });
  }

  protected reloadTask(): void {
    this.taskService.getById(this.taskId).subscribe((task) => this.task.set(task));
  }

  protected openLogTimeDialog(): void {
    console.log('asdsadas');
    const task = this.task();
    if (!task) {
      console.log('bvbbbb');
      return;
    }

    this.dialogs
      .component<WorklogDialogComponent, boolean, WorklogDialogData>(WorklogDialogComponent, {
        label: this.translate.instant('models.worklog.logTime'),
        size: 's',
        data: {
          taskId: this.taskId,
          taskIdentifier: task.identifier,
          taskTitle: task.title,
        },
      })
      .subscribe();
  }

  protected toggleFiles(): void {
    this.attachedFilesExpanded.update((v) => !v);
  }

  protected toggleInfo(): void {
    this.infoExpanded.update((v) => !v);
  }

  protected toggleAddParticipant(): void {
    this.isAddingParticipant.update((v) => !v);
    if (!this.isAddingParticipant()) {
      this.participantControl.setValue(null);
    }
  }

  protected addParticipant(): void {
    const user = this.participantControl.value;
    if (!user) return;
    this.taskService.addParticipant(this.taskId, user.id).subscribe({
      next: () => {
        this.participantControl.setValue(null);
        this.isAddingParticipant.set(false);
        this.taskService.getById(this.taskId).subscribe((task) => this.task.set(task));
      },
      error: () => {
        this.alert.error(this.translate.instant('cmd.tasks.errors.participantAddFailed'));
      },
    });
  }
}
