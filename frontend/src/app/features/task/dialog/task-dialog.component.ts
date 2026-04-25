import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  Signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { forkJoin, of, switchMap } from 'rxjs';
import { TASK_DIALOG_IMPORTS } from './task-dialog.imports';
import { CreateTaskInput } from '../types/task.model';
import { TaskCoreService } from '../service/task-core.service';
import { TaskStatus, TaskStatusesService } from '../service/task-statuses.service';
import { TaskPriority, TaskPrioritiesService } from '../service/task-priorities.service';
import { TaskCategory, TaskCategoriesService } from '../service/task-categories.service';
import { ProjectApiService } from '../../project/service/project.service';
import { Project } from '../../project/types/model/project.model';
import { Release, ReleaseService } from '../../project/service/release.service';
import { UserStore } from '../../user/store/user.store';
import { User } from '../../user/types/model/user.model';
import { AlertService } from '../../../core/declarations/services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { requiredErrorFactory } from '../../auth/model/auth.validation';
import {
  PendingEditorUploads,
  PendingFile,
} from '../../../common/editor/pending-editor-uploads.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [TASK_DIALOG_IMPORTS],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: requiredErrorFactory,
      deps: [TranslateService],
    },
  ],
})
export class TaskDialogComponent implements OnDestroy {
  private readonly taskService = inject(TaskCoreService);
  private readonly pendingUploads = inject(PendingEditorUploads);
  private readonly statusesService = inject(TaskStatusesService);
  private readonly prioritiesService = inject(TaskPrioritiesService);
  private readonly projectsService = inject(ProjectApiService);
  private readonly categoriesService = inject(TaskCategoriesService);
  private readonly releaseService = inject(ReleaseService);
  protected readonly userStore = inject(UserStore);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);

  protected readonly context = injectContext<TuiDialogContext<boolean>>();

  protected readonly statuses = signal<TaskStatus[]>([]);
  protected readonly priorities = signal<TaskPriority[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly releases = signal<Release[]>([]);
  protected readonly categories = signal<TaskCategory[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly step = signal(0);
  protected readonly pendingFiles: Signal<PendingFile[]> = this.pendingUploads.pending;

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    project: new FormControl<Project | null>(null, [Validators.required]),
    release: new FormControl<Release | null>({ value: null, disabled: true }, [
      Validators.required,
    ]),
    category: new FormControl<TaskCategory | null>({ value: null, disabled: true }, [
      Validators.required,
    ]),
    priority: new FormControl<TaskPriority | null>(null, [Validators.required]),
    status: new FormControl<TaskStatus | null>(null, [Validators.required]),
    assignee: new FormControl<User | null>(null, [Validators.required]),
    dueAt: new FormControl('', { nonNullable: true }),
  });

  protected readonly stringifyProject = (p: Project): string => p.projectName;
  protected readonly stringifyRelease = (r: Release): string => r.title;
  protected readonly stringifyCategory = (c: TaskCategory): string => c.name;
  protected readonly stringifyStatus = (s: TaskStatus): string => s.name;
  protected readonly stringifyPriority = (p: TaskPriority): string => p.name;
  protected readonly stringifyUser = (u: User): string => `${u.name} ${u.surname}`;

  constructor() {
    forkJoin([
      this.statusesService.getAll(),
      this.prioritiesService.getAll(),
      this.projectsService.getAll(),
    ]).subscribe(([statuses, priorities, projects]) => {
      this.statuses.set(statuses);
      this.priorities.set(priorities);
      this.projects.set(projects);
    });

    this.form.controls.project.valueChanges.subscribe((project) => {
      this.releases.set([]);
      this.categories.set([]);
      this.form.controls.release.setValue(null);
      this.form.controls.category.setValue(null);
      if (project) {
        this.form.controls.release.enable();
        this.form.controls.category.enable();
        forkJoin([
          this.releaseService.getByProject(project.id),
          this.categoriesService.getAll(project.id),
        ]).subscribe(([releases, categories]) => {
          this.releases.set(releases);
          this.categories.set(categories);
        });
      } else {
        this.form.controls.release.disable();
        this.form.controls.category.disable();
      }
    });
  }

  ngOnDestroy(): void {
    this.pendingUploads.clear();
  }

  protected isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  protected removeFile(blobUrl: string): void {
    this.pendingUploads.remove(blobUrl);
    const desc = this.form.controls.description.value;
    const escaped = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleaned = desc
      .replace(new RegExp(`<img[^>]+src="${escaped}"[^>]*/?>`, 'gi'), '')
      .replace(new RegExp(`<a[^>]+href="${escaped}"[^>]*>[\\s\\S]*?<\\/a>`, 'gi'), '');
    if (cleaned !== desc) {
      this.form.controls.description.setValue(cleaned);
    }
  }

  protected next(): void {
    const step1Fields = ['title', 'project', 'category', 'priority', 'assignee'] as const;
    step1Fields.forEach((key) => this.form.controls[key].markAsTouched());
    if (step1Fields.every((key) => this.form.controls[key].valid)) {
      this.step.set(1);
    }
  }

  protected previous(): void {
    this.step.set(0);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const authorId = this.userStore.user()?.id;
    if (!authorId) return;

    const v = this.form.getRawValue();
    const dueAt = v.dueAt ? new Date(v.dueAt).toISOString() : new Date(0).toISOString();

    const input: CreateTaskInput = {
      authorId,
      assigneeId: v.assignee!.id,
      projectId: v.project!.id,
      releaseId: v.release!.id,
      categoryId: v.category!.id,
      priorityId: v.priority!.id,
      statusId: v.status!.id,
      title: v.title,
      description: v.description,
      dueAt,
    };

    this.isSubmitting.set(true);
    this.taskService
      .add(input)
      .pipe(
        switchMap(({ id }) =>
          this.pendingUploads.flush('tasks', id, input.description).pipe(
            switchMap((updatedDesc) =>
              updatedDesc !== input.description
                ? this.taskService.update(id, { description: updatedDesc })
                : of(null),
            ),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.context.completeWith(true);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.alert.error(this.translate.instant('cmd.tasks.errors.createFailed'));
        },
      });
  }
}
