import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { TUI_MULTI_SELECT_TEXTS } from '@taiga-ui/kit/tokens';
import { forkJoin, of, startWith } from 'rxjs';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { Project, ProjectMember } from '../../../../project/types/model/project.model';
import { ProjectStore } from '../../../../project/store/project.store';
import { ProjectApiService } from '../../../../project/service/project.service';
import { AlertService } from '../../../../../core/declarations/services/alert.service';
import {
  CreateProjectInput,
  UpdateProjectInput,
} from '../../../../project/types/model/project-dashboard.model';
import { PROJECT_DIALOG_IMPORTS } from './project-dialog.imports';
import { loginValidationErrorsFactory } from '../../../../auth/model/auth.validation';
import { UserStore } from '../../../../user/store/user.store';
import { User } from '../../../../user/types/model/user.model';
import {
  TaskCategoriesService,
  TaskCategory,
} from '../../../../task/service/task-categories.service';

export interface ProjectDialogData {
  project: Project | null;
}

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [PROJECT_DIALOG_IMPORTS],
  templateUrl: './project-dialog.html',
  styleUrl: './project-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
    {
      provide: TUI_MULTI_SELECT_TEXTS,
      useValue: of({ all: 'Выбрать всё', none: 'Отменить выбор' }),
    },
  ],
})
export class ProjectDialogComponent {
  protected readonly store = inject(ProjectStore);
  protected readonly service = inject(ProjectApiService);
  protected readonly categoryService = inject(TaskCategoriesService);
  protected readonly userStore = inject(UserStore);
  protected readonly context = injectContext<TuiDialogContext<void, ProjectDialogData>>();
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);

  protected readonly project = this.context.data.project;
  protected readonly isEdit = this.project !== null;

  protected readonly activeTab = signal(0);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly members = signal<ProjectMember[]>([...(this.project?.members ?? [])]);
  protected readonly memberToAdd = new FormControl<string>('', { nonNullable: true });
  protected readonly selectedMember = signal<User | null>(null);
  protected readonly removingId = signal<string | null>(null);
  protected readonly addingId = signal<string | null>(null);

  protected readonly categories = signal<TaskCategory[]>([]);
  protected readonly categoryToAdd = new FormControl<string>('', { nonNullable: true });
  protected readonly addingCategory = signal(false);
  protected readonly removingCategoryId = signal<number | null>(null);

  protected readonly newCategories = signal<string[]>([]);
  protected readonly newCategoryInput = new FormControl<string>('', { nonNullable: true });

  protected readonly stringify = (user: User) => `${user.name} ${user.surname}`;

  constructor() {
    if (this.isEdit) {
      this.categoryService.getAll(this.project!.id).subscribe((cats) => this.categories.set(cats));
    }
  }

  protected readonly form = new FormGroup({
    projectName: new FormControl(this.project?.projectName ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    projectDescription: new FormControl(this.project?.projectDescription ?? '', {
      nonNullable: true,
    }),
    memberIds: new FormControl<User[]>([], { nonNullable: true }),
  });

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)), {
    initialValue: this.form.value,
  });

  protected readonly hasChanges = computed(() => {
    if (!this.isEdit) return true;
    const val = this.formValue();
    return (
      val.projectName !== (this.project?.projectName ?? '') ||
      val.projectDescription !== (this.project?.projectDescription ?? '') ||
      this.selectedFile() !== null
    );
  });

  protected readonly userGroups = computed(() => {
    const roleMap = new Map<string, User[]>();
    for (const user of this.userStore.users()) {
      const list = roleMap.get(user.role) ?? [];
      list.push(user);
      roleMap.set(user.role, list);
    }
    return Array.from(roleMap.entries()).map(([role, users]) => ({ role, users }));
  });

  protected readonly availableUserGroups = computed(() => {
    const memberIds = new Set(this.members().map((m) => m.id));
    return this.userGroups()
      .map(({ role, users }) => ({ role, users: users.filter((u) => !memberIds.has(u.id)) }))
      .filter(({ users }) => users.length > 0);
  });

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected removeMember(member: ProjectMember): void {
    this.removingId.set(member.id);
    this.service.removeMember(this.project!.id, member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        this.removingId.set(null);
      },
      error: () => this.removingId.set(null),
    });
  }

  protected addMember(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.addingId.set(member.id);
    this.service.addMember(this.project!.id, member.id).subscribe({
      next: () => {
        this.members.update((list) => [
          ...list,
          { id: member.id, name: member.name, surname: member.surname },
        ]);
        this.memberToAdd.reset();
        this.selectedMember.set(null);
        this.addingId.set(null);
      },
      error: () => this.addingId.set(null),
    });
  }

  protected addNewCategory(): void {
    const name = this.newCategoryInput.value.trim();
    if (!name || this.newCategories().includes(name)) return;
    this.newCategories.update((cats) => [...cats, name]);
    this.newCategoryInput.reset();
  }

  protected removeNewCategory(name: string): void {
    this.newCategories.update((cats) => cats.filter((c) => c !== name));
  }

  protected addCategory(): void {
    const name = this.categoryToAdd.value.trim();
    if (!name) return;
    this.addingCategory.set(true);
    this.categoryService.add(this.project!.id, name).subscribe({
      next: () => {
        this.categoryService
          .getAll(this.project!.id)
          .subscribe((cats) => this.categories.set(cats));
        this.categoryToAdd.reset();
        this.addingCategory.set(false);
      },
      error: () => this.addingCategory.set(false),
    });
  }

  protected removeCategory(category: TaskCategory): void {
    this.removingCategoryId.set(category.id);
    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== category.id));
        this.removingCategoryId.set(null);
      },
      error: () => this.removingCategoryId.set(null),
    });
  }

  protected deletePicture(): void {
    if (this.previewUrl()) {
      this.previewUrl.set(null);
      this.selectedFile.set(null);
      return;
    }
    if (this.project?.projectPictureName) {
      this.service.deletePicture(this.project.id).subscribe({
        next: () => {
          this.store.loadProjects();
          this.alert.success(this.translate.instant('cmd.projects.success.pictureDeleted'));
          this.context.completeWith();
        },
        error: () => {
          this.alert.error(this.translate.instant('cmd.projects.errors.pictureDeleteFailed'));
        },
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.isEdit) {
      const file = this.selectedFile();
      const input: UpdateProjectInput = {};

      if (value.projectName !== (this.project?.projectName ?? '')) {
        input.name = value.projectName;
      }
      if (value.projectDescription !== (this.project?.projectDescription ?? '')) {
        input.description = value.projectDescription;
      }
      if (file) {
        input.pictureName = file.name;
      }

      this.store.updateProject({ id: this.project!.id, input, file: file ?? undefined });
    } else {
      const input: CreateProjectInput = {
        projectName: value.projectName,
        projectDescription: value.projectDescription,
        projectPictureName: '',
        memberIds: value.memberIds.map((u) => u.id),
      };
      this.store.createProject({
        input,
        file: this.selectedFile() ?? undefined,
        onSuccess: (id) => {
          const cats = this.newCategories();
          if (cats.length > 0) {
            forkJoin(cats.map((name) => this.categoryService.add(id, name))).subscribe();
          }
        },
      });
    }

    this.context.completeWith();
  }
}
