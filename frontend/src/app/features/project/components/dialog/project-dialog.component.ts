import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { forkJoin, Observable, of, startWith } from 'rxjs';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { Project, ProjectMember } from '../../types/model/project.model';
import { ProjectStore } from '../../store/project.store';
import { ProjectApiService } from '../../service/project.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { CreateProjectInput, UpdateProjectInput } from '../../types/model/project-requests.model';
import { PROJECT_DIALOG_IMPORTS } from './project-dialog.imports';
import { loginValidationErrorsFactory } from '../../../auth/model/auth.validation';
import { UserStore } from '../../../user/store/user.store';
import { User } from '../../../user/types/model/user.model';
import { TaskCategoriesService, TaskCategory } from '../../../task/service/task-categories.service';
import {
  ReleaseService,
  Release,
  CreateReleaseInput,
  UpdateReleaseInput,
} from '../../service/release.service';
import { TuiDay } from '@taiga-ui/cdk';

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
  ],
})
export class ProjectDialogComponent {
  protected readonly store = inject(ProjectStore);
  protected readonly service = inject(ProjectApiService);
  protected readonly categoryService = inject(TaskCategoriesService);
  protected readonly releaseService = inject(ReleaseService);
  protected readonly userStore = inject(UserStore);
  protected readonly context = injectContext<TuiDialogContext<void, ProjectDialogData>>();
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);

  protected readonly project = this.context.data.project;
  protected readonly isEdit = this.project !== null;

  protected readonly activeTab = signal(0);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly categoriesOpen = signal(false);
  protected readonly releasesOpen = signal(false);

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

  protected readonly releases = signal<Release[]>([]);
  protected readonly addingRelease = signal(false);
  protected readonly removingReleaseId = signal<number | null>(null);
  protected readonly savingReleaseId = signal<number | null>(null);
  protected readonly editingReleaseId = signal<number | null>(null);
  protected readonly showReleaseForm = signal(false);
  protected readonly newReleases = signal<CreateReleaseInput[]>([]);

  protected readonly RELEASE_STATUSES = ['active', 'finished', 'archived', 'closed'];
  protected readonly startAtOpen = signal(false);
  protected readonly endAtOpen = signal(false);

  protected readonly releaseForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl('active', { nonNullable: true }),
    startAt: new FormControl<TuiDay | null>(null),
    endAt: new FormControl<TuiDay | null>(null),
  });

  protected readonly stringifyReleaseStatus = (status: string): string =>
    this.translate.instant(`models.release.statuses.${status.toLowerCase()}`);

  protected readonly stringify = (user: User) => `${user.name} ${user.surname}`;

  constructor() {
    if (this.isEdit) {
      this.categoryService.getAll(this.project!.id).subscribe((cats) => this.categories.set(cats));
      this.releaseService
        .getByProject(this.project!.id)
        .subscribe((rels) => this.releases.set(rels));
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
          { id: member.id, name: member.name, surname: member.surname, role: member.role },
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

  protected addNewRelease(): void {
    if (!this.releaseForm.controls.title.value?.trim()) return;
    const v = this.releaseForm.getRawValue();
    const input: CreateReleaseInput = {
      title: v.title,
      description: v.description,
      status: v.status,
      startAt: v.startAt ? v.startAt.toLocalNativeDate().toISOString() : '',
      endAt: v.endAt ? v.endAt.toLocalNativeDate().toISOString() : '',
    };
    this.newReleases.update((rels) => [...rels, input]);
    this.releaseForm.reset({ status: 'active' });
    this.showReleaseForm.set(false);
  }

  protected removeNewRelease(index: number): void {
    this.newReleases.update((rels) => rels.filter((_, i) => i !== index));
  }

  protected addRelease(): void {
    if (!this.releaseForm.controls.title.value?.trim()) return;
    this.addingRelease.set(true);
    const v = this.releaseForm.getRawValue();
    const input: CreateReleaseInput = {
      title: v.title,
      description: v.description,
      status: v.status,
      startAt: v.startAt ? v.startAt.toLocalNativeDate().toISOString() : '',
      endAt: v.endAt ? v.endAt.toLocalNativeDate().toISOString() : '',
    };
    this.releaseService.add(this.project!.id, input).subscribe({
      next: () => {
        this.releaseService
          .getByProject(this.project!.id)
          .subscribe((rels) => this.releases.set(rels));
        this.releaseForm.reset({ status: 'active' });
        this.showReleaseForm.set(false);
        this.addingRelease.set(false);
        this.alert.success(this.translate.instant('cmd.projects.success.releaseCreated'));
      },
      error: () => this.addingRelease.set(false),
    });
  }

  protected startEditRelease(release: Release): void {
    this.showReleaseForm.set(false);
    this.editingReleaseId.set(release.id);
    this.releaseForm.setValue({
      title: release.title,
      description: release.description ?? '',
      status: release.status ?? 'active',
      startAt: release.startAt?.startsWith('0001')
        ? null
        : TuiDay.fromLocalNativeDate(new Date(release.startAt)),
      endAt: release.endAt?.startsWith('0001')
        ? null
        : TuiDay.fromLocalNativeDate(new Date(release.endAt)),
    });
  }

  protected saveRelease(): void {
    const id = this.editingReleaseId();
    if (!id || !this.releaseForm.controls.title.value?.trim()) return;
    this.savingReleaseId.set(id);
    const v = this.releaseForm.getRawValue();
    const input: UpdateReleaseInput = {
      title: v.title,
      description: v.description,
      status: v.status,
      startAt: v.startAt ? v.startAt.toLocalNativeDate().toISOString() : undefined,
      updateAt: v.endAt ? v.endAt.toLocalNativeDate().toISOString() : undefined,
    };
    this.releaseService.update(id, input).subscribe({
      next: () => {
        this.releaseService
          .getByProject(this.project!.id)
          .subscribe((rels) => this.releases.set(rels));
        this.releaseForm.reset({ status: 'active' });
        this.editingReleaseId.set(null);
        this.savingReleaseId.set(null);
        this.alert.success(this.translate.instant('cmd.projects.success.releaseUpdated'));
      },
      error: () => this.savingReleaseId.set(null),
    });
  }

  protected cancelEditRelease(): void {
    this.editingReleaseId.set(null);
    this.releaseForm.reset({ status: 'active' });
  }

  protected removeRelease(release: Release): void {
    this.removingReleaseId.set(release.id);
    this.releaseService.delete(release.id).subscribe({
      next: () => {
        this.releases.update((list) => list.filter((r) => r.id !== release.id));
        this.removingReleaseId.set(null);
      },
      error: () => this.removingReleaseId.set(null),
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
        authorId: this.userStore.user()!.id,
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
          const rels = this.newReleases();
          const tasks: Observable<void>[] = [
            ...cats.map((name) => this.categoryService.add(id, name)),
            ...rels.map((rel) => this.releaseService.add(id, rel)),
          ];
          if (tasks.length > 0) {
            forkJoin(tasks).subscribe();
          }
        },
      });
    }

    this.context.completeWith();
  }
}
